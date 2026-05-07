import { Smile } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/features/shared/lib";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";

// Common emojis for quick selection
const COMMON_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "🥴",
  "😵",
  "🤯",
  "🤪",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "😴",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "😇",
  "🥳",
  "🥴",
  "🥸",
  "🤠",
  "🤡",
  "🤥",
  "🤫",
  "🤭",
  "🧐",
  "🤓",
  "😈",
  "👿",
  "👹",
  "👺",
  "💀",
  "👻",
  "👽",
  "🤖",
  "💩",
  "😺",
  "😸",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
  "👋",
  "✋",
  "🤚",
  "👌",
  "👍",
  "👎",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "💅",
  "🤳",
  "💪",
  "🦵",
  "🦶",
  "🦷",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "💟",
  "☺️",
  "💓",
  "🎉",
  "🎊",
  "🎁",
  "🎈",
  "🎂",
  "🏆",
  "🏅",
  "🎖️",
  "⭐",
  "🌟",
  "🔥",
  "💯",
  "💡",
  "💎",
  "🌈",
  "⚡",
  "🎵",
  "🎬",
  "🎮",
  "🎯",
];

interface EmojiPickerProps {
  onSelect?: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

export function EmojiPicker({ onSelect, onClose, className }: EmojiPickerProps) {
  const [search, setSearch] = useState("");

  const filteredEmojis = search
    ? COMMON_EMOJIS.filter((emoji) => {
        // Simple search - in production you might want to use emoji-mart or similar
        return emoji.includes(search) || search.includes(emoji);
      })
    : COMMON_EMOJIS.slice(0, 40);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (onClose) {
        const target = event.target as HTMLElement;
        if (!target.closest(".emoji-picker-container")) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect?.(emoji);
    onClose?.();
  };

  return (
    <div
      className={cn(
        "emoji-picker-container absolute bottom-full left-0 mb-2 z-50 w-80 rounded-xl border border-border bg-card shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border p-3">
        <Input
          type="text"
          placeholder="Emoji ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
      </div>

      {/* Emoji Grid */}
      <div className="max-h-64 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <Button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:bg-muted/50 active:scale-90"
              title={emoji}
            >
              {emoji}
            </Button>
          ))}
          {filteredEmojis.length === 0 && (
            <div className="col-span-8 flex flex-col items-center justify-center py-8 text-center">
              <Smile className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Emoji bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
