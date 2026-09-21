"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  Crosshair,
  Flame,
  Gamepad2,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Zap,
} from "lucide-react";


type ApiDevice = {
  id: number;
  brand: string;
  model: string;
  ram?: string | null;
  processor?: string | null;
  refresh_rate?: number | null;
  fps?: number | null;
  recommended_dpi?: number | null;
  status: boolean;
};

type ApiSensitivity = {
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

const levels = ["Baixa", "Média", "Alta", "Muito Alta"];

const styles = [
  { name: "Precisão", icon: Crosshair },
  { name: "Headshot", icon: Target },
  { name: "Drag Shot", icon: Zap },
  { name: "Equilibrado", icon: Gamepad2 },
  { name: "Movimento rápido", icon: Flame },
];

function calculateSensitivity(level: string, style: string) {
  const levelBase: Record<string, number> = {
    Baixa: 145,
    Média: 165,
    Alta: 180,
    "Muito Alta": 195,
  };

  const styleBonus: Record<string, number> = {
    Precisão: -5,
    Headshot: 5,
    "Drag Shot": 8,
    Equilibrado: 0,
    "Movimento rápido": 7,
  };

  const base = (levelBase[level] ?? 180) + (styleBonus[style] ?? 0);

  return {
    geral: Math.min(200, base),
    redDot: Math.min(200, base - 5),
    scope2x: Math.min(200, base - 15),
    scope4x: Math.min(200, base - 30),
    awm: Math.min(200, Math.max(80, base - 80)),
    olhadinha: Math.min(200, base),
  };
}

export default function Home() {
  const [brand, setBrand] = useState("Samsung");
  const [model, setModel] = useState("");
  const [level, setLevel] = useState("Alta");
  const [style, setStyle] = useState("Headshot");
  const [result, setResult] = useState<ApiSensitivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [apiDevices, setApiDevices] = useState<ApiDevice[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(`${apiUrl}/api/devices`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: ApiDevice[]) => {
        console.log("FF API DEVICES:", data.length, data.slice(0, 3));
        setApiDevices(data);
        })
      .catch((error) => {
        console.error("FF API ERROR:", error);
        setApiDevices([]);
        })
      .finally(() => {
        clearTimeout(timeout);
        setApiLoading(false);
      });
  }, []);

  const brands = useMemo(
    () => [...new Set(apiDevices.filter((device) => device.status).map((device) => device.brand))].sort(),
    [apiDevices]
  );

  const models = useMemo(() => {
    const apiModels = apiDevices
      .filter((device) => device.brand === brand && device.status)
      .map((device) => device.model);

    return [...new Set(apiModels)];
  }, [brand, apiDevices]);

  const selectedModel = model || models[0] || "";

  useEffect(() => {
    if (!apiLoading && brands.length > 0 && !brands.includes(brand)) {
      setBrand(brands[0]);
      setModel("");
    }
  }, [apiLoading, brands, brand]);

  useEffect(() => {
    if (!model && selectedModel) {
      setModel(selectedModel);
    }
  }, [model, selectedModel]);

  const generate = async () => {
    const selectedDevice = apiDevices.find(
      (device) =>
        device.brand === brand &&
        device.model === selectedModel &&
        device.status
    );

    if (!selectedDevice) {
      setResult(null);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/sensitivities/${selectedDevice.id}/recommend?level=${encodeURIComponent(level)}&style=${encodeURIComponent(style)}`
      );

      if (!response.ok) {
        throw new Error("Falha ao carregar sensibilidade");
      }

      const sensitivity: ApiSensitivity = await response.json();
      setResult(sensitivity);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const pageClass = dark
    ? "min-h-screen bg-[#07070a] text-white"
    : "min-h-screen bg-slate-50 text-slate-950";

  return (
    <main className={pageClass}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
              <Crosshair size={22} />
            </div>
            <div>
              <p className="font-black tracking-tight">FF Sensitivity</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-orange-400">
                Generator
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#inicio" className="hover:text-white">Início</a>
            <a href="#gerador" className="hover:text-white">Gerador</a>
            <a href="#celulares" className="hover:text-white">Celulares</a>
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
            <a href="#ajuda" className="hover:text-white">Ajuda</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"
              aria-label="Alterar tema"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-sm text-white/80">
              <a href="#inicio">Início</a>
              <a href="#gerador">Gerador</a>
              <a href="#celulares">Celulares</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#ajuda">Ajuda</a>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-600/20 blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-300">
            <Sparkles size={14} />
            GERADOR INTELIGENTE
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            Encontre a{" "}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              sensibilidade
            </span>{" "}
            ideal para o seu celular
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            Escolha seu dispositivo e estilo de jogo para receber uma
            recomendação personalizada de configuração.
          </p>

          <a
            href="#gerador"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3.5 text-sm font-bold shadow-xl shadow-orange-600/20 transition hover:scale-[1.02]"
          >
            <Target size={18} />
            Gerar Sensibilidade
          </a>
        </div>
      </section>

      <section id="gerador" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/20 sm:p-7">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
              <Settings size={21} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Gere sua Sensibilidade</h2>
              <p className="text-xs text-white/40">Configure seu perfil de jogo</p>
            </div>
          </div>

          {apiLoading && (
            <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              Carregando dispositivos...
            </div>
          )}


          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Marca"
              value={brand}
              onChange={(value) => {
                setBrand(value);
                setModel("");
              }}
              options={brands}
            />

            <SelectField
              label="Modelo"
              value={model}
              onChange={setModel}
              options={models}
              placeholder="Selecione o modelo"
            />

            <SelectField
              label="Nível de sensibilidade"
              value={level}
              onChange={setLevel}
              options={levels}
            />

            <SelectField
              label="Estilo de jogo"
              value={style}
              onChange={setStyle}
              options={styles.map((item) => item.name)}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 py-4 text-sm font-black shadow-lg shadow-orange-600/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <Activity className="animate-spin" size={19} />
                ANALISANDO SEU DISPOSITIVO...
              </>
            ) : (
              <>
                <Flame size={19} />
                GERAR SENSIBILIDADE
              </>
            )}
          </button>

          {loading && (
            <p className="mt-3 text-center text-xs text-orange-300/70">
              Calculando uma recomendação personalizada...
            </p>
          )}

          {result && (
            <div className="mt-7 animate-in rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                    Sua sensibilidade
                  </p>
                  <h3 className="mt-1 text-xl font-black">
                    {brand} {model || models[0]}
                  </h3>
                </div>
                <div className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                  {style}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Sensitivity label="Geral" value={result.geral} />
                <Sensitivity label="Red Dot" value={result.red_dot} />
                <Sensitivity label="Mira 2x" value={result.mira_2x} />
                <Sensitivity label="Mira 4x" value={result.mira_4x} />
                <Sensitivity label="Mira AWM" value={result.mira_awm} />
                <Sensitivity label="Olhadinha" value={result.olhadinha} />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => navigator.clipboard?.writeText(JSON.stringify(result))}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold hover:bg-white/10"
                >
                  📋 Copiar configuração
                </button>
                <button
                  onClick={generate}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold hover:bg-white/10"
                >
                  🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="celulares" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Descubra
            </p>
            <h2 className="mt-1 text-2xl font-black">Celulares populares</h2>
          </div>
          <Search size={20} className="text-white/30" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brands.map((name) => (
            <div
              key={name}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-orange-500/30"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Gamepad2 size={21} />
              </div>
              <h3 className="font-bold">{name}</h3>
              <p className="mt-1 text-xs text-white/35">
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-9 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Simples e rápido
            </p>
            <h2 className="mt-2 text-2xl font-black">Como funciona</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["01", "Escolha sua marca", "Selecione a fabricante do seu celular."],
              ["02", "Escolha seu modelo", "Encontre o modelo específico."],
              ["03", "Escolha seu estilo", "Defina como você prefere jogar."],
              ["04", "Gere sua configuração", "Receba uma recomendação personalizada."],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <span className="text-xs font-black text-orange-400">{number}</span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-white/40">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ajuda" className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <ShieldCheck className="mx-auto text-orange-400" size={32} />
        <h2 className="mt-4 text-2xl font-black">Recomendações, não garantias</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
          Os resultados podem variar de acordo com o dispositivo, FPS, taxa de
          atualização, DPI, versão do jogo e estilo de cada jogador.
        </p>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-xs text-white/40 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold text-white">🎯 FF Sensitivity Generator</p>
            <p className="mt-1">Projeto independente.</p>
          </div>
          <p>Não afiliado oficialmente à Garena ou ao Free Fire.</p>
        </div>
      </footer>
    
        <div className="mt-10 pb-6 text-center">
          <a
            href="/admin"
            className="text-xs text-slate-500 transition hover:text-slate-300"
          >
            Admin
          </a>
        </div>
</main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-white/60">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500/60"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
        />
      </div>
    </label>
  );
}

function Sensitivity({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-orange-400">{value}</p>
    </div>
  );
}
