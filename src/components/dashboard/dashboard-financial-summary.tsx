"use client";

import { Check, Clock, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialSummaryProps {
  successfulSalesAmount?: number;
  pendingDepositsAmount?: number;
  successfulSalesCount?: number;
  pendingDepositsCount?: number;
}

export function DashboardFinancialSummary({
  successfulSalesAmount = 0,
  pendingDepositsAmount = 0,
  successfulSalesCount = 0,
  pendingDepositsCount = 0,
}: FinancialSummaryProps) {
  return (
    <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Wallet className="text-blue-500" size={20} />
          Finansal Özet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-500">
                <Check size={16} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Başarılı Satışlar
                </div>
                <div className="font-bold text-slate-900">
                  {successfulSalesAmount.toLocaleString("tr-TR")} ₺
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
              {successfulSalesCount} Araç
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bekleyen Kaporalar
                </div>
                <div className="font-bold text-slate-900">
                  {pendingDepositsAmount.toLocaleString("tr-TR")} ₺
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
              {pendingDepositsCount} Rezervasyon
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
