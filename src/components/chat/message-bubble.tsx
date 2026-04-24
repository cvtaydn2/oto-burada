import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";

import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.createdAt), "HH:mm", { locale: tr });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
      >
        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">{formattedTime}</span>
          {isOwn && (
            <span className="text-xs opacity-70">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 inline ml-0.5" />
              ) : (
                <Check className="h-3 w-3 inline ml-0.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
