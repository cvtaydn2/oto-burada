export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
      <span className="text-xs text-muted-foreground">Satıcı yazıyor...</span>
    </div>
  );
}
