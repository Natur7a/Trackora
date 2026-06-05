-- Returns chart-ready monthly analytics for the authenticated user.
CREATE OR REPLACE FUNCTION public.get_monthly_analytics(target_month date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_start date := date_trunc('month', target_month)::date;
  current_end date := (date_trunc('month', target_month) + interval '1 month')::date;
  previous_start date := (date_trunc('month', target_month) - interval '1 month')::date;
  previous_end date := date_trunc('month', target_month)::date;

  current_income numeric := 0;
  current_expense numeric := 0;
  previous_income numeric := 0;
  previous_expense numeric := 0;

  category_breakdown jsonb := '[]'::jsonb;
  category_labels jsonb := '[]'::jsonb;
  category_values jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0)
  INTO current_income, current_expense
  FROM public."FinanceTransactions"
  WHERE user_id = auth.uid()
    AND date >= current_start
    AND date < current_end;

  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0)
  INTO previous_income, previous_expense
  FROM public."FinanceTransactions"
  WHERE user_id = auth.uid()
    AND date >= previous_start
    AND date < previous_end;

  WITH expense_by_category AS (
    SELECT
      category,
      SUM(amount) AS total
    FROM public."FinanceTransactions"
    WHERE user_id = auth.uid()
      AND type = 'expense'
      AND date >= current_start
      AND date < current_end
    GROUP BY category
  ), total_expense AS (
    SELECT COALESCE(SUM(total), 0) AS total
    FROM expense_by_category
  )
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', e.category,
          'total', ROUND(e.total, 2),
          'percentage', CASE WHEN t.total = 0 THEN 0 ELSE ROUND((e.total / t.total) * 100, 2) END
        )
        ORDER BY e.total DESC
      ),
      '[]'::jsonb
    ),
    COALESCE(jsonb_agg(e.category ORDER BY e.total DESC), '[]'::jsonb),
    COALESCE(jsonb_agg(ROUND(e.total, 2) ORDER BY e.total DESC), '[]'::jsonb)
  INTO category_breakdown, category_labels, category_values
  FROM expense_by_category e
  CROSS JOIN total_expense t;

  RETURN jsonb_build_object(
    'month', to_char(current_start, 'YYYY-MM'),
    'totals', jsonb_build_object(
      'income', ROUND(current_income, 2),
      'expense', ROUND(current_expense, 2),
      'net', ROUND(current_income - current_expense, 2)
    ),
    'categoryBreakdown', category_breakdown,
    'categoryChart', jsonb_build_object(
      'labels', category_labels,
      'values', category_values
    ),
    'monthComparison', jsonb_build_object(
      'current', jsonb_build_object(
        'income', ROUND(current_income, 2),
        'expense', ROUND(current_expense, 2),
        'net', ROUND(current_income - current_expense, 2)
      ),
      'previous', jsonb_build_object(
        'income', ROUND(previous_income, 2),
        'expense', ROUND(previous_expense, 2),
        'net', ROUND(previous_income - previous_expense, 2)
      ),
      'change', jsonb_build_object(
        'income', ROUND(current_income - previous_income, 2),
        'expense', ROUND(current_expense - previous_expense, 2),
        'net', ROUND((current_income - current_expense) - (previous_income - previous_expense), 2)
      )
    ),
    'comparisonChart', jsonb_build_object(
      'labels', jsonb_build_array('Income', 'Expense', 'Net'),
      'current', jsonb_build_array(
        ROUND(current_income, 2),
        ROUND(current_expense, 2),
        ROUND(current_income - current_expense, 2)
      ),
      'previous', jsonb_build_array(
        ROUND(previous_income, 2),
        ROUND(previous_expense, 2),
        ROUND(previous_income - previous_expense, 2)
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_analytics(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_analytics(date) TO authenticated;
