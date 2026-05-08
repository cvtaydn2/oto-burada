"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface HomeApiResults {
  featuredStatus: "fulfilled" | "rejected";
  galleryStatus: "fulfilled" | "rejected";
  latestStatus: "fulfilled" | "rejected";
}

export function HomeErrorHandler({ results }: { results: HomeApiResults }) {
  useEffect(() => {
    const errors: string[] = [];

    if (results.featuredStatus === "rejected") {
      errors.push("Vitrin ilanlar");
    }
    if (results.galleryStatus === "rejected") {
      errors.push("Galeri");
    }
    if (results.latestStatus === "rejected") {
      errors.push("Yeni ilanlar");
    }

    if (errors.length > 0) {
      toast.warning("Bazı içerikler yüklenemedi", {
        description: `${errors.join(", ")} bölümleri şu anda kullanılamıyor.`,
        duration: 5000,
      });
    }
  }, [results]);

  return null;
}
