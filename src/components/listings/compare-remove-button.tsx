"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface CompareRemoveButtonProps {
  otherIds: string;
}

export function CompareRemoveButton({ otherIds }: CompareRemoveButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (otherIds) {
          router.push(`/compare?ids=${otherIds}`);
        } else {
          router.push("/");
        }
      }}
      className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive"
      title="Karşılaştırmadan çıkar"
    >
      <X className="size-4" />
    </button>
  );
}
