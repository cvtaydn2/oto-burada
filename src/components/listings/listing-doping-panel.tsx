"use client";

import { useState } from "react";
import { 
  Rocket, 
  Search, 
  MapPin, 
  Star, 
  Zap, 
  Clock,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const DOPING_OPTIONS = [
  {
    id: "featured",
    name: "Ana Sayfa Vitrin",
    description: "İlanınız ana sayfada en üst bölümde döner.",
    icon: Star,
    price: 199,
    days: 7,
    color: "bg-amber-500",
  },
  {
    id: "urgent",
    name: "Acil Acil",
    description: "Sarı 'ACİL' etiketi ve arama sonuçlarında öncelik.",
    icon: Zap,
    price: 99,
    days: 7,
    color: "bg-red-500",
  },
  {
    id: "highlighted",
    name: "Kalın Yazı & Renkli Çerçeve",
    description: "Arama listesinde ilanınız fark edilir şekilde görünür.",
    icon: TrendingUp,
    price: 49,
    days: 15,
    color: "bg-blue-500",
  },
];

interface ListingDopingPanelProps {
  listingId: string;
  listingTitle: string;
}

export function ListingDopingPanel({ listingId, listingTitle }: ListingDopingPanelProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalPrice = DOPING_OPTIONS
    .filter(opt => selected.includes(opt.id))
    .reduce((sum, opt) => sum + opt.price, 0);

  const toggleOption = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleApply = () => {
    setLoading(true);
    setTimeout(() => {
      alert(`${totalPrice}₺ tutarındaki dopingler ilanınıza uygulanmak üzere sepete eklendi.`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Hızlı Satış Dopingleri
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{listingTitle}</span> ilanınızı milyonlarca alıcıya ulaştırın.
        </p>
      </div>

      <div className="grid gap-4">
        {DOPING_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              selected.includes(option.id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => toggleOption(option.id)}
          >
            <div className={`mt-1 p-3 rounded-xl ${option.color} text-white`}>
              <option.icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">{option.name}</span>
                <span className="font-bold text-primary">{option.price}₺</span>
              </div>
              <p className="text-sm text-muted-foreground mr-8">
                {option.description}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Clock className="h-3 w-3" />
                <span>{option.days} Gün Sürer</span>
              </div>
            </div>

            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected.includes(option.id)
                ? "border-primary bg-primary"
                : "border-muted group-hover:border-primary/50"
            }`}>
              {selected.includes(option.id) && (
                <CheckCircle2 className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Seçilen Hizmetler:</span>
            <span className="font-bold text-lg">{totalPrice}₺</span>
          </div>
          <Button 
            className="w-full h-12 text-lg font-bold"
            disabled={selected.length === 0 || loading}
            onClick={handleApply}
          >
            {loading ? "İşleniyor..." : "Dopingleri Uygula"}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Ödeme işlemleri SSL korumalı altyapımız ile güvenle gerçekleştirilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
