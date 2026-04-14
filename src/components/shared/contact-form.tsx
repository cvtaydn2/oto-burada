"use client";

import { useState } from "react";
import { Send, CheckCircle2, LoaderCircle } from "lucide-react";

const SUBJECTS = [
  "İlanımla ilgili sorun yaşıyorum",
  "Kurumsal üyelik hakkında bilgi",
  "Öneri / Şikayet",
  "Teknik destek",
  "Diğer",
];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus("loading");
    // Simulate form submission — replace with real API call
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900">Mesajınız İletildi</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          En kısa sürede size dönüş yapacağız. Ortalama yanıt süremiz 2 saattir.
        </p>
        <button
          onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
          className="mt-2 text-xs font-bold text-primary hover:underline"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Adınız Soyadınız *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="Adınız Soyadınız"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">E-posta Adresiniz *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="ornek@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">Konu</label>
        <select
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white transition"
        >
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">Mesajınız *</label>
        <textarea
          rows={4}
          required
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition"
          placeholder="Mesajınızı buraya yazın..."
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <><LoaderCircle size={18} className="animate-spin" /> Gönderiliyor...</>
        ) : (
          <><Send size={18} /> Mesajı Gönder</>
        )}
      </button>
    </form>
  );
}
