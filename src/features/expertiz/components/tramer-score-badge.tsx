"use client";

import { AlertTriangle, Car, Clock, ShieldCheck, User } from "lucide-react";

import { Badge } from "@/features/ui/components/badge";
import { Card, CardContent } from "@/features/ui/components/card";
import { cn } from "@/lib";

interface TramerScoreBadgeProps {
  score: number | null;
  className?: string;
}

export function TramerScoreBadge({ score, className }: TramerScoreBadgeProps) {
  if (score === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>TRAMER yok</span>;
  }

  const config =
    score >= 80
      ? { label: "Güvenli", color: "bg-green-100 text-green-700" }
      : score >= 60
        ? { label: "Orta", color: "bg-yellow-100 text-yellow-700" }
        : { label: "Riskli", color: "bg-red-100 text-red-700" };

  return (
    <Badge className={cn("gap-1", config.color, className)}>
      <ShieldCheck className="h-3 w-3" />
      {score} ({config.label})
    </Badge>
  );
}

interface VehicleHistoryWidgetProps {
  data: {
    tramerScore: number;
    accidentCount: number;
    ownershipCount: number;
    lastKm: number;
    lastInspection: string | null;
  } | null;
  className?: string;
}

export function VehicleHistoryWidget({ data, className }: VehicleHistoryWidgetProps) {
  if (!data) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Car className="h-5 w-5" />
            <span>TRAMER sorgusu yapılmamış.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreConfig =
    data.tramerScore >= 80
      ? { label: "Güvenli", className: "text-green-600", bg: "bg-green-50" }
      : data.tramerScore >= 60
        ? { label: "Orta", className: "text-yellow-600", bg: "bg-yellow-50" }
        : { label: "Risk", className: "text-red-600", bg: "bg-red-50" };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={cn("p-4 border-b", scoreConfig.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("h-5 w-5", scoreConfig.className)} />
            <span className={cn("font-bold", scoreConfig.className)}>
              TRAMER Skoru: {data.tramerScore}
            </span>
          </div>
          <span className={cn("text-xs font-medium", scoreConfig.className)}>
            {scoreConfig.label}
          </span>
        </div>
      </div>

      <CardContent className="grid grid-cols-2 gap-4 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Hasar Kaydı</p>
            <p className="font-medium">
              {data.accidentCount === 0 ? "Yok" : `${data.accidentCount} kayıt`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Sahip Sayısı</p>
            <p className="font-medium">{data.ownershipCount}. sahip</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Son Kilometre</p>
            <p className="font-medium">{data.lastKm.toLocaleString("tr-TR")} km</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Son Ekspertiz</p>
            <p className="font-medium">
              {data.lastInspection
                ? new Date(data.lastInspection).toLocaleDateString("tr-TR")
                : "Bilinmiyor"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExpertInspectionBadgeProps {
  hasInspection: boolean;
  className?: string;
}

export function ExpertInspectionBadge({ hasInspection, className }: ExpertInspectionBadgeProps) {
  if (!hasInspection) {
    return null;
  }

  return (
    <Badge className={cn("bg-blue-100 text-blue-700", className)}>
      <ShieldCheck className="h-3 w-3" />
      Ekspertizli
    </Badge>
  );
}
