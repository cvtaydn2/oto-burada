"use client";

import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void> | void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setContent("");
    onTyping(false);
    try {
      await onSendMessage(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // Typing indicator logic
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className="p-4 border-t bg-background flex items-center gap-2"
      role="form"
      aria-label="Mesaj gönder"
    >
      <Input
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Mesajınızı yazın..."
        className="flex-1"
        aria-label="Mesajınız"
        disabled={isSending}
      />
      <Button
        size="icon"
        onClick={() => void handleSend()}
        disabled={!content.trim() || isSending}
        className="rounded-full shadow-md transition-transform"
        aria-label="Gönder"
      >
        <SendHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
