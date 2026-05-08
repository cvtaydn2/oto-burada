"use client";

import { Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/card";
import { cn } from "@/lib";

interface Appointment {
  id: string;
  date: Date;
  time: string;
  customerName: string;
  description: string;
  type: "expertise" | "showroom" | "other";
}

interface DashboardAppointmentsProps {
  appointments?: Appointment[];
}

export function DashboardAppointments({ appointments = [] }: DashboardAppointmentsProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(date);
  };

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date).toUpperCase();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-5">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Calendar className="text-blue-500" size={20} />
          Yaklaşan Rezervasyonlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Calendar size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500">Yaklaşan rezervasyon bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-col items-center justify-center rounded-lg border text-center",
                      appointment.type === "expertise"
                        ? "bg-blue-50 border-blue-100"
                        : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <span className="text-[10px] font-bold text-slate-600">
                      {formatDate(appointment.date).split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {formatMonth(appointment.date).split(" ")[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {appointment.customerName}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {appointment.type === "expertise" ? "Ekspertiz Randevusu" : "Araç Gösterimi"}{" "}
                      - {appointment.description}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400">{appointment.time}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
