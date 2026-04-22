"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  CheckCircle2, 
  Loader2,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { processBulkListings } from "@/app/dashboard/bulk-import/actions";
import type { ListingCreateInput } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListingRow {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  price: number;
  city: string;
  district: string;
  whatsapp_phone: string;
  description: string;
  vin: string;
  isValid: boolean;
  errors: string[];
}

export function BulkImportWizard() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ListingRow[] => {
    const lines = text.split("\n").filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const dataLines = lines.slice(1);

    return dataLines.map((line, index) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ""));
      
      const rowData: Record<string, string> = {};
      headers.forEach((header, i) => {
        rowData[header] = values[i];
      });

      const errors: string[] = [];
      const year = parseInt(rowData.year || "");
      const price = parseInt(rowData.price || "");
      const mileage = parseInt(rowData.mileage || "");

      if (!rowData.title) errors.push("Başlık eksik");
      if (!rowData.brand) errors.push("Marka eksik");
      if (!rowData.model) errors.push("Model eksik");
      if (isNaN(year) || year < 1950 || year > 2100) errors.push("Geçersiz yıl");
      if (isNaN(price) || price <= 0) errors.push("Geçersiz fiyat");
      if (isNaN(mileage) || mileage < 0) errors.push("Geçersiz km");
      if (!["benzin", "dizel", "lpg", "hibrit", "elektrik"].includes(rowData.fuel_type?.toLowerCase())) errors.push("Geçersiz yakıt");
      if (!["manuel", "otomatik", "yari_otomatik"].includes(rowData.transmission?.toLowerCase())) errors.push("Geçersiz vites");
      if (!rowData.vin || rowData.vin.length < 5) errors.push("Geçersiz VIN");

      return {
        id: `row-${index}`,
        title: rowData.title || "",
        brand: rowData.brand || "",
        model: rowData.model || "",
        year: isNaN(year) ? 0 : year,
        price: isNaN(price) ? 0 : price,
        mileage: isNaN(mileage) ? 0 : mileage,
        fuel_type: rowData.fuel_type || "",
        transmission: rowData.transmission || "",
        city: rowData.city || "",
        district: rowData.district || "",
        whatsapp_phone: rowData.whatsapp_phone || "",
        description: rowData.description || "",
        vin: rowData.vin || "",
        isValid: errors.length === 0,
        errors
      } as ListingRow;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Lütfen sadece CSV dosyası yükleyin.");
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsedRows = parseCSV(text);
      setRows(parsedRows);
      toast.success(`${parsedRows.length} satır başarıyla okundu.`);
    } catch {
      toast.error("Dosya okunurken bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpload = async () => {
    const validRows = rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error("Yüklenecek geçerli bir ilan bulunamadı.");
      return;
    }

    setIsUploading(true);
    try {
      const transformedInputs: ListingCreateInput[] = validRows.map(row => ({
        title: row.title,
        brand: row.brand,
        model: row.model,
        year: row.year,
        mileage: row.mileage,
        fuelType: row.fuel_type.toLowerCase() as ListingCreateInput["fuelType"],
        transmission: row.transmission.toLowerCase() as ListingCreateInput["transmission"],
        price: row.price,
        city: row.city,
        district: row.district,
        description: row.description,
        whatsappPhone: row.whatsapp_phone,
        vin: row.vin,
        images: [],
      }));
      const result = (await processBulkListings(transformedInputs)) as { 
        success: boolean; 
        count?: number; 
        error?: string; 
        partial?: boolean; 
        message?: string;
      };
      
      if (result.success) {
        if (result.partial) {
          toast.warning(`Kısmi Başarı: ${result.count} ilan yüklendi.`, {
            description: result.error,
            duration: 10000,
          });
        } else {
          toast.success(result.message || `${result.count} ilan başarıyla yüklendi.`);
        }
        setRows([]); // Clear on success
      } else {
        toast.error(result.error || "Yükleme sırasında bir hata oluştu.");
      }
    } catch {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Card 
          className="border-2 border-dashed border-muted-foreground/20 bg-secondary/10 hover:bg-secondary/20 transition-all rounded-2xl overflow-hidden group cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            {isProcessing ? (
              <Loader2 className="size-20 text-primary animate-spin" />
            ) : (
              <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary transition-transform">
                <Upload size={40} strokeWidth={2.5} />
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold italic uppercase">CSV Dosyanızı Buraya Sürükleyin</h2>
              <p className="text-muted-foreground font-medium italic">Veya tıklayarak dosya seçin (.csv)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleFileChange} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary/30 p-6 rounded-3xl border border-border">
         <div className="flex gap-6">
            <div className="space-y-1">
               <p className="text-xs font-bold text-muted-foreground uppercase">Toplam Satır</p>
               <p className="text-2xl font-bold italic">{rows.length}</p>
            </div>
            <div className="space-y-1 text-emerald-600">
               <p className="text-xs font-bold opacity-70 uppercase tracking-tighter">Geçerli</p>
               <p className="text-2xl font-bold italic">{validCount}</p>
            </div>
            {invalidCount > 0 && (
              <div className="space-y-1 text-rose-600">
                <p className="text-xs font-bold opacity-70 uppercase tracking-tighter">Hatalı</p>
                <p className="text-2xl font-bold italic">{invalidCount}</p>
              </div>
            )}
         </div>
         <div className="flex gap-3">
            <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold border-2" onClick={() => setRows([])}>
              Temizle
            </Button>
            <Button 
               className="h-14 px-10 rounded-2xl font-bold text-lg shadow-sm shadow-primary/20 flex items-center gap-2"
               disabled={validCount === 0 || isUploading}
               onClick={handleUpload}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
              {validCount} İlanı Moderasyona Gönder
            </Button>
         </div>
      </div>

      <div className="rounded-3xl border border-border bg-background overflow-hidden overflow-x-auto shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-bold text-foreground">Durum</TableHead>
              <TableHead className="font-bold text-foreground">Araç</TableHead>
              <TableHead className="font-bold text-foreground">Marka/Model</TableHead>
              <TableHead className="font-bold text-foreground">Fiyat</TableHead>
              <TableHead className="font-bold text-foreground">Hatalar</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border group">
                <TableCell>
                  {row.isValid ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-lg py-1">Geçerli</Badge>
                  ) : (
                    <Badge variant="destructive" className="rounded-lg py-1">Hatalı</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm line-clamp-1">{row.title}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-medium text-muted-foreground">{row.brand} {row.model} ({row.year})</p>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm italic">₺{new Intl.NumberFormat("tr-TR").format(row.price)}</p>
                </TableCell>
                <TableCell>
                  {row.errors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.errors.map((error, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{error}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">Yok</span>
                  )}
                </TableCell>
                <TableCell>
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => removeRow(row.id)}
                   >
                     <Trash2 size={16} />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
