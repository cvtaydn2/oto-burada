"use client";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="bg-background border rounded-lg shadow-lg p-2 min-w-[200px]">
      <div className="grid grid-cols-6 gap-1">
        {["😊", "😂", "❤️", "👍", "🎉", "🔥"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="hover:bg-muted rounded p-1 text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
