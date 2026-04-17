import Link from "next/link";
import { Car, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-white px-4 text-center" aria-labelledby="not-found-heading">
      {/* Big 404 with car icon overlay */}
      <div className="relative mb-8 select-none">
        <span className="text-[160px] font-black leading-none text-blue-50 tracking-tighter">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-200">
            <Car size={44} />
          </div>
        </div>
      </div>

      <h2 id="not-found-heading" className="mb-3 text-3xl font-extrabold text-gray-800">
        Üzgünüz, Aradığınız Araç Yoldan Çıkmış!
      </h2>
      <p className="mb-10 max-w-md text-gray-500">
        Aradığınız ilan yayından kaldırılmış olabilir veya yanlış bir bağlantıya tıkladınız. Hayalinizdeki aracı bulmak için ana sayfaya dönebilirsiniz.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-600 active:scale-95"
        >
          <Home size={18} />
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/listings"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-8 text-sm font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95"
        >
          <Search size={18} />
          İlanları Keşfet
        </Link>
      </div>

      <div className="mt-16">
        <Link href="/" className="flex items-center justify-center gap-2 text-blue-500 font-bold text-lg">
          <Car size={20} />
          OtoBurada
        </Link>
      </div>
    </main>
  );
}
