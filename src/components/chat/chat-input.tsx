"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent("");
    onTyping(false);
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
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-background flex items-center gap-2" role="form" aria-label="Mesaj gönder">
      <Input
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Mesajınızı yazın..."
        className="flex-1"
        aria-label="Mesajınız"
      />
      <Button 
        size="icon" 
        onClick={handleSend} 
        disabled={!content.trim()}
        className="rounded-full shadow-md hover:scale-105 transition-transform"
        aria-label="Gönder"
      >
        <SendHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
