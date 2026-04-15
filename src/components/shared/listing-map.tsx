"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface ListingMapProps {
  city: string;
  district: string;
  className?: string;
}

// Türkiye şehir koordinatları (yaklaşık merkez)
const CITY_COORDS: Record<string, [number, number]> = {
  "İstanbul": [41.0082, 28.9784],
  "Ankara": [39.9334, 32.8597],
  "İzmir": [38.4192, 27.1287],
  "Bursa": [40.1885, 29.0610],
  "Antalya": [36.8969, 30.7133],
  "Adana": [37.0000, 35.3213],
  "Konya": [37.8746, 32.4932],
  "Gaziantep": [37.0662, 37.3833],
  "Mersin": [36.8000, 34.6333],
  "Kayseri": [38.7312, 35.4787],
  "Eskişehir": [39.7767, 30.5206],
  "Diyarbakır": [37.9144, 40.2306],
  "Samsun": [41.2867, 36.3300],
  "Denizli": [37.7765, 29.0864],
  "Şanlıurfa": [37.1591, 38.7969],
  "Trabzon": [41.0015, 39.7178],
  "Kocaeli": [40.8533, 29.8815],
  "Malatya": [38.3552, 38.3095],
  "Erzurum": [39.9055, 41.2658],
  "Van": [38.4891, 43.4089],
};

function getCoords(city: string): [number, number] {
  return CITY_COORDS[city] ?? [39.9334, 32.8597]; // Ankara default
}

export function ListingMap({ city, district, className = "" }: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Leaflet CSS'i dinamik olarak yükle
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const coords = getCoords(city);

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: coords,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      // OpenStreetMap tile layer — tamamen ücretsiz
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar',
        maxZoom: 19,
      }).addTo(map);

      // Özel marker ikonu
      const icon = L.divIcon({
        html: `
          <div style="
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 32px;
            height: 32px;
            box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          "></div>
        `,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family: sans-serif; font-size: 13px; font-weight: 600; padding: 4px 2px;">
          <div style="color: #1e293b;">${city}${district ? `, ${district}` : ""}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Araç konumu (yaklaşık)</div>
        </div>`,
        { closeButton: false }
      ).openPopup();

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [city, district]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}
      style={{ isolation: "isolate", zIndex: 0 }}
    >
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: 240 }} />
      {/* Overlay label — z-index yüksek tutuldu ama map container'ı isolate edildi */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-slate-200 pointer-events-none">
        <MapPin size={13} className="text-blue-500" />
        <span className="text-xs font-bold text-slate-700">
          {city}{district ? `, ${district}` : ""}
        </span>
        <span className="text-[10px] text-slate-400 ml-1">(yaklaşık)</span>
      </div>
    </div>
  );
}
