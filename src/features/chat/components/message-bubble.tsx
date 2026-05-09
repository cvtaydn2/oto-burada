import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, CheckCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.createdAt), "HH:mm", { locale: tr });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group relative`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
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

      {isOwn && onDelete && (
        <Button
          onClick={() => onDelete(message.id)}
          className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          title="Mesajı Sil"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
