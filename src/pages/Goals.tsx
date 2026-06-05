import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Goal {
  id: number;
  user_id?: string;
  title: string;
  target: number;
  deadline: string;
  created_at?: string;
}

export default function Goals() {
  const { user } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const [currentSavings, setCurrentSavings] = useState(0);
  useEffect(() => {
  if (user) {
    fetchGoals();
    fetchSavings();
  }
}, [user]);

  async function fetchGoals() {
  if (!user) return;

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return;
  }

  setGoals(data || []);
}

async function fetchSavings() {
  if (!user) return;

  const { data, error } = await supabase
    .from("FinanceTransactions")
    .select("amount, type")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  let income = 0;
  let expense = 0;

  data?.forEach((transaction) => {
    if (transaction.type === "income") {
      income += Number(transaction.amount);
    } else {
      expense += Number(transaction.amount);
    }
  });

  setCurrentSavings(income - expense);
}

  async function addGoal(e: React.FormEvent) {
  e.preventDefault();

  if (!user) return;

  const { error } = await supabase
    .from("goals")
    .insert([
      {
        user_id: user.id,
        title,
        target: Number(target),
        deadline,
      },
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setTitle("");
  setTarget("");
  setDeadline("");

  fetchGoals();
  fetchSavings();
}

  async function deleteGoal(id: number) {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  fetchGoals();
  fetchSavings();
}

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <main className="container mx-auto py-10 space-y-8 animate-fade-up">

        {/* HEADER */}
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            GOALS
          </p>

          <h1 className="display-serif text-5xl md:text-6xl font-semibold tracking-tight mt-3">
            Your Saving Goals
          </h1>

          <p className="text-muted-foreground mt-4">
            Set your financial goals and track your progress automatically.
          </p>
        </div>

        {/* FORM */}
        <div   className="
    glass-card
    rounded-3xl
    p-8
    border
    border-white/10
    shadow-xl
    bg-gradient-to-br
    from-background
    to-background/80
  ">

          <h2 className="text-2xl font-semibold mb-6">
            Create New Goal
          </h2>

          <form
            onSubmit={addGoal}
            className="grid md:grid-cols-4 gap-4"
          >

            <input
              type="text"
              placeholder="Goal Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-3"
              required
            />

            <input
              type="number"
              placeholder="Target Amount"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-3"
              required
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-3"
              required
            />

            <button
              type="submit"
              className="rounded-xl bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition"
            >
              Add Goal
            </button>

          </form>
        </div>

        {/* GOALS LIST */}
        <div className="space-y-6">

          {goals.length === 0 && (
            <div className="glass-card rounded-3xl p-10 text-center">
              <p className="text-muted-foreground">
                No goals added yet.
              </p>
            </div>
          )}

          {goals.map((goal) => {

            const progress = Math.min(
              (currentSavings / goal.target) * 100,
              100
            );

            const remaining = Math.max(
              goal.target - currentSavings,
              0
            );

            return (
              <div
                key={goal.id}
                className="
glass-card
rounded-3xl
p-8
border
border-white/10
shadow-2xl
hover:scale-[1.02]
transition-all
duration-300
"
              >

                <div className="flex justify-between items-center mb-6">

                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
  🎯 {goal.title}
</h2>

                    <p className="text-muted-foreground mt-1">
                      Deadline: {goal.deadline}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="border border-border rounded-xl px-4 py-2 hover:bg-secondary transition"
                  >
                    Delete
                  </button>

                </div>

                <div className="mb-4">

  {progress >= 100 ? (
    <span className="
      px-3 py-1
      rounded-full
      bg-green-500/20
      text-green-400
      font-semibold
    ">
      🎉 Goal Achieved
    </span>
  ) : (
    <span className="
      px-3 py-1
      rounded-full
      bg-yellow-500/20
      text-yellow-400
      font-semibold
    ">
      In Progress
    </span>
  )}

</div>

                {/* STATS */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">

                  <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-muted-foreground text-sm">
                      Target
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      ${goal.target.toLocaleString()}
                    </h3>
                  </div>

                  <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-muted-foreground text-sm">
                      Savings
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      ${currentSavings.toLocaleString()}
                    </h3>
                  </div>

                  <div className="bg-secondary/40 rounded-2xl p-4">
                    <p className="text-muted-foreground text-sm">
                      Remaining
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                      ${remaining.toLocaleString()}
                    </h3>
                  </div>

                </div>

                {/* PROGRESS */}
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">

                  <div
  className="
    h-4
    transition-all
    duration-700
    bg-gradient-to-r
    from-emerald-400
    via-green-500
    to-teal-500
  "
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <div className="flex justify-between items-center mt-4">

  <span className="text-sm text-muted-foreground">
    Goal Progress
  </span>

  <span className="
    px-3
    py-1
    rounded-full
    bg-green-500/20
    text-green-400
    font-semibold
  ">
    {progress.toFixed(1)}%
  </span>

</div>

              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}