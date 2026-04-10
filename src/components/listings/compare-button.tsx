"use client";

import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";

import { useCompare } from "@/components/shared/compare-provider";

interface CompareButtonProps {
  listingId: string;
  className?: string;
}

export function CompareButton({ listingId, className = "" }: CompareButtonProps) {
  const router = useRouter();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const inCompare = isInCompare(listingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(listingId);
    } else {
      const added = addToCompare(listingId);
      if (!added) {
        return;
      }
    }
    router.push(`/compare?ids=${listingId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={inCompare ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
    >
      {inCompare ? (
        <>
          <Check size={16} />
          <span>Eklendi</span>
        </>
      ) : (
        <>
          <Plus size={16} />
          <span>Karşılaştır</span>
        </>
      )}
    </button>
  );
}