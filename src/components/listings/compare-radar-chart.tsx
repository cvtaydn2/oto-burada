"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Listing } from "@/types";

interface CompareRadarChartProps {
  cars: Listing[];
}

export function CompareRadarChart({ cars }: CompareRadarChartProps) {
  // Normalize values for radar chart (0-100 scale)
  // Categories: Price (inverted), Year, Mileage (inverted), Damage Status (inverted)
  
  const categories = [
    { key: "price", label: "Ekonomi (Fiyat)" },
    { key: "year", label: "Model Yılı" },
    { key: "mileage", label: "Düşük KM" },
    { key: "tramer", label: "Hasarsızlık" },
  ];

  const maxPrice = Math.max(...cars.map(c => c.price));
  const minYear = Math.min(...cars.map(c => c.year));
  const maxYear = Math.max(...cars.map(c => c.year));
  const maxMileage = Math.max(...cars.map(c => c.mileage));
  const maxTramer = Math.max(...cars.map(c => c.tramerAmount || 0), 1);

  const data = categories.map(cat => {
    const row: any = { subject: cat.label };
    
    cars.forEach(car => {
      let value = 0;
      if (cat.key === "price") {
        // Higher score for lower price
        value = 100 - (car.price / maxPrice) * 100;
      } else if (cat.key === "year") {
        // Higher score for newer year
        value = ((car.year - minYear) / (maxYear - minYear || 1)) * 100;
      } else if (cat.key === "mileage") {
        // Higher score for lower mileage
        value = 100 - (car.mileage / (maxMileage || 1)) * 100;
      } else if (cat.key === "tramer") {
        // Higher score for lower tramer
        value = 100 - ((car.tramerAmount || 0) / maxTramer) * 100;
      }
      row[car.id] = Math.round(Math.max(10, value));
    });
    
    return row;
  });

  const colors = ["#4f46e5", "#ef4444", "#10b981", "#f59e0b"];

  return (
    <div className="h-[400px] w-full py-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 500 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          {cars.map((car, idx) => (
            <Radar
              key={car.id}
              name={`${car.brand} ${car.model}`}
              dataKey={car.id}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.4}
            />
          ))}
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
