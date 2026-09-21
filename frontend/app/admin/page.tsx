"use client";

import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Falha no login");
      }

      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_user", JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));

      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold">
            FF
          </div>
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <p className="mt-2 text-slate-400">
            FF Sensitivity Generator
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <h2 className="mb-6 text-xl font-semibold">Entrar</h2>

          <label className="mb-2 block text-sm text-slate-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@email.com"
            required
            className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
          />

          <label className="mb-2 block text-sm text-slate-300">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
          />

          {error && (
            <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
      </div>
    </main>
  );
}
