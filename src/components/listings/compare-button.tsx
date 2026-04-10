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
  const { compareIds, isInCompare, addToCompare, removeFromCompare } = useCompare();
  const inCompare = isInCompare(listingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let nextIds = compareIds;

    if (inCompare) {
      removeFromCompare(listingId);
      nextIds = compareIds.filter((id) => id !== listingId);
    } else {
      const added = addToCompare(listingId);
      if (!added) {
        return;
      }
      nextIds = [...compareIds, listingId];
    }

    router.push(nextIds.length > 0 ? `/compare?ids=${nextIds.join(",")}` : "/compare");
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
