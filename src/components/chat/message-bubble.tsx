import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isMe ? "justify-end" : "justify-start"
      )}
      aria-label={isMe ? "Gönderdiğiniz mesaj" : "Gelen mesaj"}
    >
      <div
        className={cn(
          "max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm",
          isMe
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted text-muted-foreground rounded-tl-none border"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn(
            "text-[10px] mt-1 opacity-70",
            isMe ? "text-right" : "text-left"
          )}
        >
          {format(new Date(message.createdAt), "HH:mm", { locale: tr })}
        </div>
      </div>
    </div>
  );
}
