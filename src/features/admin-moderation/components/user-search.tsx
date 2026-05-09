"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function UserSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set("q", debouncedValue);
    } else {
      params.delete("q");
    }
    router.replace(`?${params.toString()}`);
  }, [debouncedValue, router, searchParams]);

  return (
    <div className="relative flex-1 group">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
        size={18}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="İsim, e-posta veya üye ID ile hızlı ara..."
        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-50 placeholder:italic placeholder:text-slate-300"
      />
    </div>
  );
}
