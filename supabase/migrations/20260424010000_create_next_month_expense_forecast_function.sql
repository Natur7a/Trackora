-- Predicts next month expense from authenticated user's historical monthly expenses.
CREATE OR REPLACE FUNCTION public.get_next_month_expense_forecast()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  month_count integer := 0;
  avg_expense numeric := 0;
  slope numeric := 0;
  prediction numeric := 0;
  sigma numeric := 0;
  lower_bound numeric := 0;
  upper_bound numeric := 0;
  next_month date := (date_trunc('month', CURRENT_DATE) + interval '1 month')::date;

  trend_direction text := 'flat';
  trend_percent numeric := 0;
  confidence_level text := 'low';

  top_categories jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  WITH monthly_expense AS (
    SELECT
      date_trunc('month', date)::date AS month,
      SUM(amount)::numeric AS expense_total,
      ROW_NUMBER() OVER (ORDER BY date_trunc('month', date)::date) AS idx
    FROM public."FinanceTransactions"
    WHERE user_id = auth.uid()
      AND type = 'expense'
    GROUP BY date_trunc('month', date)::date
    ORDER BY month
  )
  SELECT
    COUNT(*),
    COALESCE(AVG(expense_total), 0),
    COALESCE(REGR_SLOPE(expense_total, idx), 0),
    COALESCE(STDDEV_SAMP(expense_total), 0)
  INTO month_count, avg_expense, slope, sigma
  FROM monthly_expense;

  IF month_count < 2 THEN
    RETURN jsonb_build_object(
      'month', to_char(next_month, 'YYYY-MM'),
      'predictedExpense', 0,
      'confidence', jsonb_build_object(
        'level', 'low',
        'lower', 0,
        'upper', 0
      ),
      'factors', jsonb_build_object(
        'trendDirection', 'flat',
        'trendPercent', 0,
        'topCategories', jsonb_build_array()
      ),
      'dataPoints', month_count,
      'isInsufficientData', true,
      'message', 'Not enough data to generate a prediction yet. Add at least 2 months of expenses.'
    );
  END IF;

  prediction := GREATEST(avg_expense + slope, 0);

  IF avg_expense > 0 THEN
    trend_percent := ROUND((slope / avg_expense) * 100, 2);
  END IF;

  IF slope > 0.01 THEN
    trend_direction := 'up';
  ELSIF slope < -0.01 THEN
    trend_direction := 'down';
  ELSE
    trend_direction := 'flat';
  END IF;

  IF month_count >= 6 THEN
    confidence_level := 'high';
    lower_bound := GREATEST(prediction - (0.75 * sigma), 0);
    upper_bound := prediction + (0.75 * sigma);
  ELSIF month_count >= 4 THEN
    confidence_level := 'medium';
    lower_bound := GREATEST(prediction - (1.0 * sigma), 0);
    upper_bound := prediction + (1.0 * sigma);
  ELSE
    confidence_level := 'low';
    lower_bound := GREATEST(prediction - (1.25 * sigma), 0);
    upper_bound := prediction + (1.25 * sigma);
  END IF;

  WITH recent_months AS (
    SELECT
      date_trunc('month', date)::date AS month,
      category,
      SUM(amount)::numeric AS amount
    FROM public."FinanceTransactions"
    WHERE user_id = auth.uid()
      AND type = 'expense'
      AND date >= (date_trunc('month', CURRENT_DATE) - interval '3 month')::date
    GROUP BY date_trunc('month', date)::date, category
  ), category_average AS (
    SELECT
      category,
      AVG(amount)::numeric AS avg_amount
    FROM recent_months
    GROUP BY category
  ), total_avg AS (
    SELECT COALESCE(SUM(avg_amount), 0) AS total
    FROM category_average
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'category', c.category,
        'average', ROUND(c.avg_amount, 2),
        'sharePercent', CASE WHEN t.total = 0 THEN 0 ELSE ROUND((c.avg_amount / t.total) * 100, 2) END
      ) ORDER BY c.avg_amount DESC
    ),
    '[]'::jsonb
  )
  INTO top_categories
  FROM (
    SELECT *
    FROM category_average
    ORDER BY avg_amount DESC
    LIMIT 3
  ) c
  CROSS JOIN total_avg t;

  RETURN jsonb_build_object(
    'month', to_char(next_month, 'YYYY-MM'),
    'predictedExpense', ROUND(prediction, 2),
    'confidence', jsonb_build_object(
      'level', confidence_level,
      'lower', ROUND(lower_bound, 2),
      'upper', ROUND(upper_bound, 2)
    ),
    'factors', jsonb_build_object(
      'trendDirection', trend_direction,
      'trendPercent', trend_percent,
      'topCategories', top_categories
    ),
    'dataPoints', month_count,
    'isInsufficientData', false,
    'message', 'Prediction generated from historical monthly expenses.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_month_expense_forecast() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_month_expense_forecast() TO authenticated;
