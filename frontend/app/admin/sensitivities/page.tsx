"use client";

import { useEffect, useState } from "react";

type Device = {
  id: number;
  brand: string;
  model: string;
};

type Sensitivity = {
  id: number;
  device_id: number;
  level: string;
  style: string;
  geral: number;
  red_dot: number;
  mira_2x: number;
  mira_4x: number;
  mira_awm: number;
  olhadinha: number;
};

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

const fields = [
  ["geral", "Geral"],
  ["red_dot", "Red Dot"],
  ["mira_2x", "Mira 2x"],
  ["mira_4x", "Mira 4x"],
  ["mira_awm", "Mira AWM"],
  ["olhadinha", "Olhadinha"],
] as const;

export default function SensitivitiesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<Sensitivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    fetch(`${API}/api/devices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin";
          return [];
        }

        if (!r.ok) {
          throw new Error("Erro ao carregar dispositivos.");
        }

        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDevices(data);
        }
      })
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Erro ao carregar dispositivos."
        )
      );
  }, []);

  useEffect(() => {
    if (!selected) {
      setItems([]);
      return;
    }

    const token = localStorage.getItem("admin_token");

    setLoading(true);
    setError("");
    setMessage("");

    fetch(`${API}/api/sensitivities/${selected}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin";
          return [];
        }

        if (!r.ok) {
          throw new Error("Erro ao carregar sensibilidades.");
        }

        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Erro ao carregar."
        )
      )
      .finally(() => setLoading(false));
  }, [selected]);

  function updateValue(
    id: number,
    field: keyof Sensitivity,
    value: string
  ) {
    const numberValue = Number(value);

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: Number.isFinite(numberValue)
                ? Math.max(0, Math.min(200, numberValue))
                : 0,
            }
          : item
      )
    );
  }

  async function saveSensitivity(item: Sensitivity) {
    const token = localStorage.getItem("admin_token");

    setSavingId(item.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/sensitivities/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            geral: item.geral,
            red_dot: item.red_dot,
            mira_2x: item.mira_2x,
            mira_4x: item.mira_4x,
            mira_awm: item.mira_awm,
            olhadinha: item.olhadinha,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Não foi possível salvar."
        );
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? data : entry
        )
      );

      setMessage(
        `Sensibilidade ${item.level} / ${item.style} salva com sucesso.`
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao salvar sensibilidade."
      );
    } finally {
      setSavingId(null);
    }
  }

  const selectedDevice = devices.find(
    (device) => String(device.id) === selected
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">🎯 Sensibilidades</h1>
            <p className="text-sm text-slate-400">
              Gerenciamento das configurações do gerador
            </p>
          </div>

          <button
            onClick={() =>
              (window.location.href = "/admin/dashboard")
            }
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Escolha o dispositivo
          </label>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="">Selecione um celular...</option>

            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.brand} — {device.model}
              </option>
            ))}
          </select>

          {selectedDevice && (
            <p className="mt-3 text-sm text-slate-400">
              {items.length} configurações encontradas para{" "}
              <span className="font-semibold text-white">
                {selectedDevice.brand} {selectedDevice.model}
              </span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-300">
            {message}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Carregando sensibilidades...
          </div>
        )}

        {!loading && selected && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      {item.level}
                    </h2>
                    <p className="text-sm text-slate-400">
                      Estilo: {item.style}
                    </p>
                  </div>

                  <button
                    onClick={() => saveSensitivity(item)}
                    disabled={savingId === item.id}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {savingId === item.id
                      ? "Salvando..."
                      : "💾 Salvar"}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fields.map(([field, label]) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-sm text-slate-400">
                        {label}
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={item[field]}
                        onChange={(e) =>
                          updateValue(
                            item.id,
                            field,
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold outline-none focus:border-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && selected && items.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Nenhuma sensibilidade encontrada.
          </div>
        )}

        {!selected && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center">
            <div className="text-4xl">🎯</div>
            <h2 className="mt-3 text-xl font-bold">
              Gerencie as sensibilidades
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Selecione um celular acima para visualizar e editar
              suas configurações.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
