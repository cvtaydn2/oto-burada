import Link from "next/link";
import { CarFront, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-4 rounded-full bg-indigo-50 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
          <CarFront size={48} />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 shadow-lg border border-indigo-100">
          <Search size={20} />
        </div>
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Yolun Sonuna Geldik
      </h1>
      <p className="mb-10 max-w-md text-lg text-slate-500">
        Aradığınız sayfa başka bir rotaya sapmış veya yayından kaldırılmış olabilir. Endişelenmeyin, sizi ana yola geri çıkaralım.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Home size={18} />
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/listings"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-8 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
        >
          <Search size={18} />
          İlanlarda Ara
        </Link>
      </div>

      <div className="mt-16 text-sm text-slate-400">
        Hata Kodu: <span className="font-mono font-medium text-slate-600">404 - Sayfa Bulunamadı</span>
      </div>
    </div>
  );
}
