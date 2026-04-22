"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("./listing-map").then((mod) => mod.ListingMap), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse rounded-xl bg-muted" />,
});

interface ListingMapWrapperProps {
  city: string;
  district: string;
  className?: string;
}

export function ListingMapWrapper({ city, district, className }: ListingMapWrapperProps) {
  return <ListingMap city={city} district={district} className={className} />;
}
