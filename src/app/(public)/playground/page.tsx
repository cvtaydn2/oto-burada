"use client";

import React, { useState } from "react";

import { PlaygroundResponse, submitPlaygroundPrompt } from "./actions";

interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  placeholder: string;
}

const PRESETS: Preset[] = [
  {
    id: "general",
    name: "General AI Assistant",
    icon: "✨",
    description: "Ask Claude Opus 4.6 anything or brainstorm new features.",
    systemPrompt: "Sen yüksek kıdemli, yapıcı ve yardımsever bir yapay zeka asistanısın.",
    placeholder: "Claude'a bir soru sorun veya projeniz hakkında konuşun...",
  },
  {
    id: "review",
    name: "God-Tier Code Reviewer",
    icon: "🔍",
    description: "Analyze code for security, performance, and best practices.",
    systemPrompt:
      "Sen dünya standartlarında kıdemli bir yazılım mimarı ve güvenlik uzmanısın. Paylaşılan kodları güvenlik açıkları (IDOR, RLS vb.), performans darboğazları ve mimari uyum açısından inceleyip detaylı, yapıcı Türkçe bir rapor sunarsın.",
    placeholder: "İncelemek istediğiniz kod bloğunu buraya yapıştırın...",
  },
  {
    id: "copywriter",
    name: "Listing Description Copywriter",
    icon: "✍️",
    description: "Generate highly engaging, SEO-friendly vehicle listing descriptions.",
    systemPrompt:
      "Sen uzman bir otomotiv içerik yazarı ve pazarlamacısın. Verilen araç bilgilerini (marka, model, yıl, kilometre, hasar durumu, özellikler) alarak, OtoBurada platformuna uygun, alıcıyı cezbeden, dürüst ama son derece profesyonel Türkçe ilan açıklamaları hazırlarsın. Bullet point'ler ve temiz başlıklar kullanırsın.",
    placeholder:
      "Örnek: 2018 model Volkswagen Golf, 95.000 km, hatasız boyasız, cam tavanlı, tüm bakımları yetkili serviste yapıldı...",
  },
  {
    id: "sql",
    name: "Postgres SQL Optimizer",
    icon: "⚡",
    description: "Optimize Supabase Postgres SQL queries for speed and cost.",
    systemPrompt:
      "Sen yüksek düzeyde uzmanlaşmış bir PostgreSQL veritabanı yöneticisi (DBA) ve Supabase uzmanısın. Gönderilen SQL sorgularını analiz ederek index önerileri, performans iyileştirmeleri ve RLS uyumu hakkında optimize edilmiş çözümler sunarsın.",
    placeholder: "SELECT * FROM listings WHERE status = 'active' ORDER BY created_at DESC...",
  },
];

export default function PlaygroundPage() {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0]);
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [model, setModel] = useState("claude-opus-4-6");
  const [customSystemPrompt, setCustomSystemPrompt] = useState(PRESETS[0].systemPrompt);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePresetChange = (preset: Preset) => {
    setSelectedPreset(preset);
    setCustomSystemPrompt(preset.systemPrompt);
    setPrompt("");
    setResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResponse(null);

    const res = await submitPlaygroundPrompt({
      prompt,
      systemPrompt: customSystemPrompt,
      temperature,
      maxTokens,
      model,
    });

    setResponse(res);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (response?.content) {
      navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Dynamic Glowing Accent Header */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none blur-[100px]" />

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
              OtoBurada AI Playground
            </h1>
            <p className="text-xs text-slate-400 font-medium">Powered by Claude Opus 4.6</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active Endpoint: Connected
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left column: Presets and Options */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Presets Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Select Mode Preset
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                    selectedPreset.id === preset.id
                      ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-blue-500/50 text-white shadow-md shadow-blue-500/5"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{preset.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{preset.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              AI Model Parameters
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Model Name</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="claude-opus-4-6">claude-opus-4-6 (Default)</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Temperature (Creativity)</span>
                <span className="text-blue-400 font-mono">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">Max Tokens</label>
              <input
                type="number"
                min="1"
                max="8192"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400">System Instruction</label>
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right column: Form and Output Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chat Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Input Prompt ({selectedPreset.name})
              </h2>
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
              >
                Clear Input
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedPreset.placeholder}
              rows={8}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 font-sans leading-relaxed resize-y"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Executing...
                  </>
                ) : (
                  <>
                    <span>Generate Response</span>
                    <span>⚡</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Response Output Area */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md shadow-xl flex flex-col overflow-hidden min-h-[400px]">
            <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  AI Response Output
                </h2>
              </div>
              {response?.content && (
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    copied
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span>{copied ? "Copied!" : "Copy Response"}</span>
                  <span>{copied ? "✓" : "📋"}</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto max-h-[600px] leading-relaxed font-sans text-slate-200">
              {isLoading ? (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="relative">
                    <div className="size-12 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 size-12 rounded-full bg-blue-500/10 blur-md animate-pulse" />
                  </div>
                  <p className="text-xs font-medium animate-pulse">Claude is thinking deeply...</p>
                </div>
              ) : response ? (
                response.success ? (
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-100 select-text">
                    {response.content}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    <p className="font-bold flex items-center gap-2">
                      <span>⚠️</span> Execution Failed
                    </p>
                    <p className="mt-1 font-mono text-xs">{response.error}</p>
                  </div>
                )
              ) : (
                <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-600 gap-2">
                  <span className="text-4xl">🔮</span>
                  <p className="text-xs font-medium">
                    Ready to receive prompt. Fill out form and submit.
                  </p>
                </div>
              )}
            </div>

            {/* Response Footer Stats */}
            {response?.success && response.metadata && (
              <div className="border-t border-slate-800 px-5 py-3 bg-slate-950/20 flex flex-wrap gap-4 text-xs font-mono text-slate-500">
                <div>
                  Latency:{" "}
                  <span className="text-blue-400">
                    {(response.metadata.latencyMs / 1000).toFixed(2)}s
                  </span>
                </div>
                {response.metadata.usage && (
                  <>
                    <div>
                      Prompt Tokens:{" "}
                      <span className="text-indigo-400">
                        {response.metadata.usage.promptTokens}
                      </span>
                    </div>
                    <div>
                      Completion Tokens:{" "}
                      <span className="text-indigo-400">
                        {response.metadata.usage.completionTokens}
                      </span>
                    </div>
                    <div>
                      Total Tokens:{" "}
                      <span className="text-indigo-400">{response.metadata.usage.totalTokens}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
