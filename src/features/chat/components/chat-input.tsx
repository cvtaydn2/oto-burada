"use client";

import { Loader2, Send, Smile } from "lucide-react";
import React, { KeyboardEvent, useRef, useState } from "react";

import { Button } from "@/features/ui/components/button";

import { EmojiPicker } from "../ui/emoji-picker";

interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>;
  onTyping?: (typing: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || disabled) return;

    await onSend(content);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onTyping?.(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    onTyping?.(e.target.value.length > 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative flex items-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        <Smile className="h-5 w-5" />
      </Button>

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Mesajınızı yazın..."
        className="flex-1 resize-none min-h-[40px] max-h-[120px] pr-12"
        rows={1}
        disabled={disabled}
      />

      <Button
        type="button"
        size="icon"
        onClick={handleSubmit}
        disabled={!content.trim() || disabled}
      >
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Simple textarea wrapper since shadcn's Textarea might not have ref support
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
