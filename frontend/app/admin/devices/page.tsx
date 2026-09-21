"use client";

import { useEffect, useState } from "react";

type Device = {
  id: number;
  brand: string;
  model: string;
  ram?: string;
  processor?: string;
  refresh_rate?: number;
  fps?: number;
  recommended_dpi?: number;
  status: boolean;
};

type FormData = {
  brand: string;
  model: string;
  ram: string;
  processor: string;
  refresh_rate: string;
  fps: string;
  recommended_dpi: string;
};

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

const emptyForm: FormData = {
  brand: "",
  model: "",
  ram: "",
  processor: "",
  refresh_rate: "",
  fps: "",
  recommended_dpi: "",
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  async function loadDevices() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");

      const response = await fetch(`${API}/api/devices/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os dispositivos.");
      }

      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dispositivos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    loadDevices();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(device: Device) {
    setEditingId(device.id);
    setForm({
      brand: device.brand,
      model: device.model,
      ram: device.ram || "",
      processor: device.processor || "",
      refresh_rate:
        device.refresh_rate !== undefined && device.refresh_rate !== null
          ? String(device.refresh_rate)
          : "",
      fps:
        device.fps !== undefined && device.fps !== null
          ? String(device.fps)
          : "",
      recommended_dpi:
        device.recommended_dpi !== undefined &&
        device.recommended_dpi !== null
          ? String(device.recommended_dpi)
          : "",
    });
    setShowForm(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDevice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");

      const body = {
        brand: form.brand,
        model: form.model,
        ram: form.ram || null,
        processor: form.processor || null,
        refresh_rate: form.refresh_rate
          ? Number(form.refresh_rate)
          : null,
        fps: form.fps ? Number(form.fps) : null,
        recommended_dpi: form.recommended_dpi
          ? Number(form.recommended_dpi)
          : null,
      };

      const url =
        editingId !== null
          ? `${API}/api/devices/${editingId}`
          : `${API}/api/devices`;

      const response = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Não foi possível salvar o dispositivo."
        );
      }

      if (editingId !== null) {
        setDevices((current) =>
          current.map((device) =>
            device.id === editingId ? data : device
          )
        );
      } else {
        setDevices((current) => [...current, data]);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar dispositivo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(device: Device) {
    setError("");

    try {
      const token = localStorage.getItem("admin_token");

      if (device.status) {
        const confirmed = window.confirm(
          `Desativar ${device.brand} ${device.model}?`
        );

        if (!confirmed) return;

        const response = await fetch(`${API}/api/devices/${device.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Não foi possível desativar o dispositivo."
          );
        }

        setDevices((current) =>
          current.map((item) =>
            item.id === device.id ? { ...item, status: false } : item
          )
        );

        return;
      }

      const response = await fetch(`${API}/api/devices/${device.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            "Não foi possível ativar o dispositivo."
        );
      }

      setDevices((current) =>
        current.map((item) => (item.id === device.id ? data : item))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao alterar estado do dispositivo."
      );
    }
  }

  const filtered = devices.filter((device) =>
    `${device.brand} ${device.model}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">📱 Dispositivos</h1>
            <p className="text-sm text-slate-400">
              Gestão de celulares do FF Sensitivity Generator
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/admin/dashboard")}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Celulares cadastrados</h2>
            <p className="text-sm text-slate-400">
              {devices.filter((device) => device.status).length} ativos · {devices.length} cadastrados
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar marca ou modelo..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 sm:w-80"
            />

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setEditingId(null);
                  setForm(emptyForm);
                  setShowForm(true);
                }
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
            >
              {showForm ? "✕ Fechar" : "＋ Adicionar celular"}
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={saveDevice}
            className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="mb-5">
              <h3 className="text-lg font-bold">
                {editingId !== null
                  ? "✏️ Editar celular"
                  : "＋ Adicionar celular"}
              </h3>
              <p className="text-sm text-slate-400">
                Preencha as informações do dispositivo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Marca"
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                required
                placeholder="Modelo"
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                placeholder="RAM (ex.: 8 GB)"
                value={form.ram}
                onChange={(e) =>
                  setForm({ ...form, ram: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                placeholder="Processador"
                value={form.processor}
                onChange={(e) =>
                  setForm({ ...form, processor: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                placeholder="Refresh Rate (Hz)"
                value={form.refresh_rate}
                onChange={(e) =>
                  setForm({ ...form, refresh_rate: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                placeholder="FPS"
                value={form.fps}
                onChange={(e) =>
                  setForm({ ...form, fps: e.target.value })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="number"
                placeholder="DPI recomendado"
                value={form.recommended_dpi}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recommended_dpi: e.target.value,
                  })
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : editingId !== null
                    ? "Salvar alterações"
                    : "Salvar celular"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Carregando dispositivos...
          </div>
        )}

        {!loading && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950">
                  <tr>
                    <th className="px-5 py-4">Marca</th>
                    <th className="px-5 py-4">Modelo</th>
                    <th className="px-5 py-4">RAM</th>
                    <th className="px-5 py-4">Processador</th>
                    <th className="px-5 py-4">FPS</th>
                    <th className="px-5 py-4">DPI</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((device) => (
                    <tr
                      key={device.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4 font-semibold">
                        {device.brand}
                      </td>

                      <td className="px-5 py-4">{device.model}</td>

                      <td className="px-5 py-4">
                        {device.ram || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {device.processor || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {device.fps || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {device.recommended_dpi || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            device.status
                              ? "rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-300"
                              : "rounded-full bg-red-950 px-3 py-1 text-xs text-red-300"
                          }
                        >
                          {device.status ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(device)}
                            className="rounded-lg border border-blue-800 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-950"
                          >
                            ✏️ Editar
                          </button>

                          <button
                            onClick={() => toggleStatus(device)}
                            className={
                              device.status
                                ? "rounded-lg border border-red-800 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950"
                                : "rounded-lg border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950"
                            }
                          >
                            {device.status ? "🔴 Desativar" : "🟢 Ativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        Nenhum dispositivo encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
