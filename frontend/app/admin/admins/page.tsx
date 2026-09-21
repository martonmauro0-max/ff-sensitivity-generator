"use client";

import { useEffect, useState } from "react";

type Admin = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Admin | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;

  async function loadAdmins() {
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/admin";
        return;
      }

      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Erro ao carregar administradores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function startEdit(admin: Admin) {
    setEditing(admin);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role);
    setPassword("");
    setMessage("");
  }

  function cancelEdit() {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("Admin");
  }

  async function saveAdmin() {
    if (!editing) return;

    const body: Record<string, unknown> = {
      name,
      email,
      role,
      is_active: editing.is_active,
    };

    if (password.trim()) body.password = password;

    const res = await fetch(`${API}/api/admin/admins/${editing.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Não foi possível atualizar.");
      return;
    }

    setMessage("Administrador atualizado com sucesso.");
    cancelEdit();
    await loadAdmins();
  }

  async function toggleAdmin(admin: Admin) {
    const res = await fetch(`${API}/api/admin/admins/${admin.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: !admin.is_active }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Não foi possível alterar o estado.");
      return;
    }

    setMessage(
      admin.is_active
        ? "Administrador desativado."
        : "Administrador ativado."
    );

    await loadAdmins();
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`${API}/api/admin/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Não foi possível criar o administrador.");
      return;
    }

    setMessage("Administrador criado com sucesso.");
    setName("");
    setEmail("");
    setPassword("");
    setRole("Admin");
    await loadAdmins();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <p>Carregando administradores...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Administradores</h1>
            <p className="text-sm text-slate-400">
              Gerencie contas, funções e acesso ao painel.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/admin/dashboard")}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Voltar ao painel
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">
            {message}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? "Editar administrador" : "Novo administrador"}
          </h2>

          <form
            onSubmit={editing ? (e) => {
              e.preventDefault();
              saveAdmin();
            } : createAdmin}
            className="grid gap-3 md:grid-cols-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder={editing ? "Nova senha (opcional)" : "Senha"}
              required={!editing}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Editor</option>
              <option>Moderador</option>
            </select>

            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-500"
              >
                {editing ? "Salvar alterações" : "Criar administrador"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg bg-slate-700 px-5 py-2"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">
              Administradores cadastrados ({admins.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-800">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">{admin.name}</div>
                  <div className="text-sm text-slate-400">{admin.email}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    ID #{admin.id} · {admin.role}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      admin.is_active
                        ? "bg-emerald-900/40 text-emerald-300"
                        : "bg-red-900/40 text-red-300"
                    }`}
                  >
                    {admin.is_active ? "Ativo" : "Inativo"}
                  </span>

                  <button
                    onClick={() => startEdit(admin)}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => toggleAdmin(admin)}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      admin.is_active
                        ? "bg-red-700 hover:bg-red-600"
                        : "bg-emerald-700 hover:bg-emerald-600"
                    }`}
                  >
                    {admin.is_active ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                Nenhum administrador encontrado.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
