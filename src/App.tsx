import { useEffect, useState } from "react";

type HealthStatus = {
  effect: "configured";
  service: "cf-inbox";
  status: "ok";
};

type HealthState =
  | { state: "loading" }
  | { state: "ready"; value: HealthStatus }
  | { state: "error"; message: string };

export function App() {
  const [health, setHealth] = useState<HealthState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    const loadHealth = async () => {
      try {
        const response = await fetch("/api/health", { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const value: HealthStatus = await response.json();
        setHealth({ state: "ready", value });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setHealth({
          state: "error",
          message: error instanceof Error ? error.message : "Unknown API error",
        });
      }
    };

    void loadHealth();

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/20 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">
          Milestone 0
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          CF Inbox
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          A lightweight, single-tenant email inbox built entirely on Cloudflare.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <p className="text-sm font-medium text-slate-400">Worker bootstrap</p>
          {health.state === "loading" && (
            <p className="mt-2 text-slate-200">Checking the Worker API…</p>
          )}
          {health.state === "ready" && (
            <p className="mt-2 text-emerald-400">
              API online · Effect {health.value.effect}
            </p>
          )}
          {health.state === "error" && (
            <p className="mt-2 text-rose-400">API unavailable: {health.message}</p>
          )}
        </div>

        <p className="mt-8 text-sm leading-6 text-slate-400">
          Mailbox storage, authentication, and email delivery arrive in later milestones.
          Receive-only operation will not depend on outbound email configuration.
        </p>
      </section>
    </main>
  );
}
