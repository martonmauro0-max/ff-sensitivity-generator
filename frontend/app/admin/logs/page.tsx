"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, Activity } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

type Log = {
  id: number;
  admin_id: number;
  action: string;
  description: string;
  resource: string | null;
  resource_id: number | null;
  created_at: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível carregar os logs.");
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("pt-PT");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              Voltar ao Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Logs do Sistema</h1>
                <p className="text-sm text-slate-400">
                  Histórico das atividades administrativas
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={20} />
            <div>
              <p className="font-semibold">Atividade administrativa</p>
              <p className="text-sm text-slate-400">
                {logs.length} registro(s) carregado(s)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Carregando logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhuma atividade registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Admin ID</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Recurso</th>
                    <th className="px-4 py-3">Descrição</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        #{log.admin_id}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-400">
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {log.resource
                          ? `${log.resource}${log.resource_id ? ` #${log.resource_id}` : ""}`
                          : "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
