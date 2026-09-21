"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Device = {
  id: number;
  brand: string;
  model: string;
  status: boolean;
};

type Stats = {
  total: number;
  devices: number;
  levels: number;
  styles: number;
};

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    async function loadDashboard() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [meResponse, devicesResponse, statsResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/admin/me`, { headers }),
            fetch(`${apiUrl}/api/devices`),
            fetch(`${apiUrl}/api/sensitivities/stats`),
          ]);

        if (meResponse.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin";
          return;
        }

        if (meResponse.ok) {
          const me = await meResponse.json();
          setAdmin(me);
          localStorage.setItem("admin_user", JSON.stringify(me));
        }

        if (devicesResponse.ok) {
          const data = await devicesResponse.json();
          setDevices(Array.isArray(data) ? data : []);
        }

        if (statsResponse.ok) {
          setStats(await statsResponse.json());
        }
      } catch {
        setDevices([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [apiUrl]);

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin";
  }

  const activeDevices = devices.filter((device) => device.status).length;
  const brands = new Set(devices.map((device) => device.brand)).size;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold">FF Sensitivity Generator</h1>
            <p className="text-sm text-slate-400">Painel Administrativo</p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-800 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-8">
          <h2 className="text-3xl font-bold">
            Olá, {admin?.name || "Administrador"} 👋
          </h2>
          <p className="mt-2 text-slate-400">
            Bem-vindo ao centro de controle do seu site.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Dispositivos</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "..." : devices.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Dispositivos ativos</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "..." : activeDevices}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Marcas</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "..." : brands}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Sensibilidades</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "..." : stats?.total ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">📱 Dispositivos</h3>
            <p className="mt-2 text-sm text-slate-400">
              Adicione, edite ou remova celulares do gerador.
            </p>
            <button
              onClick={() => (window.location.href = "/admin/devices")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Gerenciar
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">🎯 Sensibilidades</h3>
            <p className="mt-2 text-sm text-slate-400">
              Controle os níveis e estilos de sensibilidade.
            </p>
            <button
              onClick={() =>
                (window.location.href = "/admin/sensitivities")
              }
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Gerenciar
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">📊 Gerações</h3>
            <p className="mt-2 text-sm text-slate-400">
              Consulte o histórico e as estatísticas das sensibilidades geradas.
            </p>
            <button
              onClick={() => (window.location.href = "/admin/generations")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Ver Gerações
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">👥 Administradores</h3>
            <p className="mt-2 text-sm text-slate-400">
              Gerencie administradores e suas funções.
            </p>
            <button
              onClick={() => (window.location.href = "/admin/admins")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Gerenciar
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">⚙️ Configurações</h3>
            <p className="mt-2 text-sm text-slate-400">
              Controle as configurações do sistema.
            </p>
            <button
              onClick={() => (window.location.href = "/admin/settings")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Configurar
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">📋 Logs do Sistema</h3>
            <p className="mt-2 text-sm text-slate-400">
              Consulte o histórico das atividades administrativas.
            </p>
            <button
              onClick={() => (window.location.href = "/admin/logs")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500"
            >
              Ver Logs
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-bold">
            Informações do administrador
          </h3>

          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-400">Nome:</span>{" "}
              {admin?.name || "-"}
            </p>
            <p>
              <span className="text-slate-400">Email:</span>{" "}
              {admin?.email || "-"}
            </p>
            <p>
              <span className="text-slate-400">Função:</span>{" "}
              {admin?.role || "-"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
