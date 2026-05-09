"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";

interface SupportResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketCategory, TicketPriority } from "@/features/support/services/ticket-service";

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "listing", label: "İlan ile ilgili" },
  { value: "account", label: "Hesap ile ilgili" },
  { value: "payment", label: "Ödeme ile ilgili" },
  { value: "technical", label: "Teknik sorun" },
  { value: "feedback", label: "Geri bildirim" },
  { value: "other", label: "Diğer" },
];

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Normal" },
  { value: "high", label: "Yüksek" },
  { value: "urgent", label: "Acil" },
];

export function TicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [priority, setPriority] = useState<TicketPriority>("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });

      let data: SupportResponse | null = null;
      try {
        data = (await res.json()) as SupportResponse;
      } catch {
        // Safe fallback for non-JSON
      }

      if (!res.ok) {
        const errorMsg =
          data?.error?.message ||
          data?.message ||
          "Destek talebi oluşturulamadı. Lütfen tekrar deneyin.";
        throw new Error(errorMsg);
      }

      toast.success(
        data?.message || "Destek talebiniz oluşturuldu. En kısa sürede size dönüş yapacağız."
      );
      setSubject("");
      setDescription("");
      setCategory("other");
      setPriority("medium");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Konu</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Öncelik</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Başlık</Label>
        <Input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Sorununuzu kısaca açıklayın"
          className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary transition-colors"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sorununuzu detaylı olarak açıklayın..."
          className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
          required
        />
      </div>

      <Button type="submit" disabled={loading || !subject.trim() || !description.trim()}>
        {loading ? "Gönderiliyor..." : "Talebi Gönder"}
      </Button>
    </form>
  );
}
