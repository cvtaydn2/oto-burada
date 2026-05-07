import { ArrowLeft, CheckCircle2, FileSpreadsheet, Info } from "lucide-react";
import Link from "next/link";

import { requireUser } from "@/features/auth/lib/session";
import { BulkImportWizard } from "@/features/modules/components/dashboard/bulk-import-wizard";
import { Alert, AlertDescription, AlertTitle } from "@/features/ui/components/alert";
import { Button } from "@/features/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/ui/components/card";

export default async function BulkImportPage() {
  await requireUser();

  return (
    <div className="container max-w-5xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Dashboard&apos;a Dön
          </Link>
          <h1 className="text-4xl font-bold italic tracking-tight uppercase">Toplu İlan Yükleme</h1>
          <p className="text-muted-foreground font-medium">
            Profesyonel satıcılar için hızlı araç girişi
          </p>
        </div>
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl font-bold bg-background border-2 border-border hover:bg-secondary/50"
          asChild
        >
          <Link href="/templates/bulk_import_template.csv" download>
            <FileSpreadsheet className="mr-2" size={18} />
            Örnek Şablonu İndir
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <BulkImportWizard />

          <Alert className="bg-amber-500/5 border-amber-500/20 text-amber-900 rounded-2xl">
            <Info className="size-5" />
            <AlertTitle className="font-bold">Önemli Hatırlatma</AlertTitle>
            <AlertDescription className="text-amber-800/80 font-medium">
              Toplu yükleme yapmadan önce araç görsellerini ilan oluşturma sonrası veya Dashboard
              üzerinden tek tek eklemeniz gerekecektir. Toplu yükleme şu an için sadece metin ve
              teknik verileri destekler.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold uppercase tracking-tight">Klavuz</CardTitle>
              <CardDescription className="font-medium italic">
                Başarılı bir yükleme için adımlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Örnek şablonu indirin ve Excel veya Google Sheets ile açın.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Sütun başlıklarını değiştirmeden araç verilerinizi girin.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">
                  3
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Dosyanızı <span className="text-primary font-bold">CSV (Virgülle Ayrılmış)</span>{" "}
                  formatında kaydedin.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold">
                  4
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Buraya yükleyin ve hataları kontrol edip onaylayın.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <CardContent className="py-6 flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 uppercase tracking-tighter">
                  Limitler
                </p>
                <p className="text-xs font-bold text-emerald-700/70 italic">
                  Tek seferde maksimum 50 ilan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
