"use client";

import { useEffect, useState } from "react";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
};

type Stats = {
  total: number;
  devices: number;
  levels: number;
  styles: number;
};

type Backup = {
  filename: string;
  size: number;
  created_at: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);

  const API =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

  async function loadBackups() {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/admin/backups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error("Erro ao carregar backups:", error);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    async function loadSettings() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [meResponse, statsResponse, healthResponse] =
          await Promise.all([
            fetch(`${API}/api/admin/me`, { headers }),
            fetch(`${API}/api/sensitivities/stats`),
            fetch(`${API}/health`),
          ]);

        if (meResponse.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin";
          return;
        }

        if (meResponse.ok) {
          const data = await meResponse.json();
          setUser(data);
          localStorage.setItem("admin_user", JSON.stringify(data));
        }

        if (statsResponse.ok) {
          setStats(await statsResponse.json());
        }

        setApiOnline(healthResponse.ok);
        await loadBackups();
      } catch {
        setApiOnline(false);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [API]);

  async function createBackup() {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setBackupLoading(true);

    try {
      const response = await fetch(`${API}/api/admin/backup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Backup criado: ${data.filename}`);
        await loadBackups();
      } else {
        alert(data.detail || "Erro ao criar backup");
      }
    } catch {
      alert("Não foi possível criar o backup.");
    } finally {
      setBackupLoading(false);
    }
  }

  async function downloadBackup(filename: string) {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/admin/backups/${encodeURIComponent(filename)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.detail || "Não foi possível baixar o backup.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Não foi possível baixar o backup.");
    }
  }

  async function deleteBackup(filename: string) {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o backup "${filename}"?`
    );

    if (!confirmed) return;

    setBackupLoading(true);

    try {
      const response = await fetch(
        `${API}/api/admin/backups/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert("Backup eliminado com sucesso.");
        await loadBackups();
      } else {
        alert(data.detail || "Erro ao eliminar backup.");
      }
    } catch {
      alert("Não foi possível eliminar o backup.");
    } finally {
      setBackupLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Carregando configurações...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-sm text-slate-400">
              Administração e manutenção do sistema
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">👤 Conta administrativa</h2>

          {user && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Nome</p>
                <p>{user.name}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p>{user.email}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Função</p>
                <p>{user.role}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-green-400">
                  {user.is_active === false ? "Inativo" : "Ativo"}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">📊 Estatísticas</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Sensibilidades</p>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Dispositivos</p>
              <p className="text-2xl font-bold">{stats?.devices ?? 0}</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Níveis</p>
              <p className="text-2xl font-bold">{stats?.levels ?? 0}</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Estilos</p>
              <p className="text-2xl font-bold">{stats?.styles ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-2 text-lg font-semibold">🔌 Estado da API</h2>

          <p className={apiOnline ? "text-green-400" : "text-red-400"}>
            {apiOnline ? "● API online" : "● API offline"}
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-2 text-lg font-semibold">💾 Backup do sistema</h2>

          <p className="mb-4 text-sm text-slate-400">
            Crie uma cópia do banco de dados antes de alterações importantes.
          </p>

          <button
            onClick={createBackup}
            disabled={backupLoading}
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backupLoading ? "Criando..." : "Criar backup"}
          </button>

          <div className="mt-6">
            <h3 className="mb-3 font-semibold">Backups existentes</h3>

            {backups.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhum backup encontrado.
              </p>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="break-all text-sm font-medium">
                        {backup.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(backup.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => downloadBackup(backup.filename)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"
                      >
                        Baixar
                      </button>

                      {user?.role === "Super Admin" && (
                        <button
                          onClick={() => deleteBackup(backup.filename)}
                          disabled={backupLoading}
                          className="rounded-lg border border-red-800 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
