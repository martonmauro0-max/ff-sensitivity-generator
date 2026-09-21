"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  RefreshCw,
  Smartphone,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

type Generation = {
  id: number;
  device_id: number;
  brand: string;
  model: string;
  level: string;
  style: string;
  created_at: string;
};

type GenerationStats = {
  total: number;
  devices: number;
  levels: number;
  styles: number;
};

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGenerations() {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [generationsResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/generations`, { headers }),
        fetch(`${API_URL}/api/admin/generations/stats`, { headers }),
      ]);

      if (
        generationsResponse.status === 401 ||
        generationsResponse.status === 403 ||
        statsResponse.status === 401 ||
        statsResponse.status === 403
      ) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin";
        return;
      }

      if (!generationsResponse.ok || !statsResponse.ok) {
        throw new Error("Não foi possível carregar as gerações.");
      }

      const generationsData = await generationsResponse.json();
      const statsData = await statsResponse.json();

      setGenerations(
        Array.isArray(generationsData) ? generationsData : []
      );
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar as gerações."
      );
      setGenerations([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGenerations();
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("pt-PT");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
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
                <h1 className="text-2xl font-bold">
                  Gerações de Sensibilidade
                </h1>
                <p className="text-sm text-slate-400">
                  Histórico das sensibilidades geradas pelo sistema
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadGenerations}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total de gerações</p>
              <Activity size={20} className="text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "..." : stats?.total ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Dispositivos usados</p>
              <Smartphone size={20} className="text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "..." : stats?.devices ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Níveis usados</p>
              <BarChart3 size={20} className="text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "..." : stats?.levels ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Estilos usados</p>
              <BarChart3 size={20} className="text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "..." : stats?.styles ?? 0}
            </p>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Carregando gerações...
            </div>
          ) : generations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhuma geração registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Dispositivo</th>
                    <th className="px-4 py-3">Nível</th>
                    <th className="px-4 py-3">Estilo</th>
                    <th className="px-4 py-3">Device ID</th>
                  </tr>
                </thead>

                <tbody>
                  {generations.map((generation) => (
                    <tr
                      key={generation.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                        {formatDate(generation.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold">
                          {generation.brand}
                        </div>
                        <div className="text-xs text-slate-400">
                          {generation.model}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-400">
                          {generation.level}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {generation.style}
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        #{generation.device_id}
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
