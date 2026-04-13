import { Calendar, Clock, ChevronLeft, Share2, Globe, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogDetailPage() {
  return (
    <article className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 space-y-16 animate-in fade-in duration-1000">
      {/* Article Header */}
      <div className="space-y-8 max-w-4xl">
         <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-[-4px] transition-transform italic">
            <ChevronLeft size={14} />
            BLOG ARCHIVE
         </Link>
         
         <div className="space-y-6">
            <span className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest italic">Pazar Analizi</span>
            <h1 className="text-4xl md:text-7xl font-black tracking-tightest leading-none text-slate-900 uppercase italic">
              2024 MODEL YILI <span className="text-primary block mt-4">ARAÇ DEĞERLEME RAPORU</span>
            </h1>
         </div>

         <div className="flex flex-wrap items-center gap-8 text-slate-400 text-xs font-bold uppercase tracking-widest italic pt-4">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-full bg-slate-100 overflow-hidden relative">
                  <Image src="https://i.pravatar.cc/150?u=otoburada" alt="Author" fill className="object-cover" />
               </div>
               <span>OtoBurada Ekibi</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-2"><Calendar size={16} /> 12 NİSAN 2024</div>
            <div className="flex items-center gap-2"><Clock size={16} /> 8 DK OKUMA</div>
         </div>
      </div>

      {/* Main Image */}
      <div className="relative h-[400px] md:h-[650px] w-full rounded-[4rem] overflow-hidden shadow-3xl shadow-slate-200/50">
         <Image 
           src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop" 
           alt="Blog Banner" 
           fill 
           className="object-cover" 
         />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-12 gap-16 relative">
         <div className="lg:col-span-8 space-y-10">
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter italic">
               <p className="text-xl font-medium leading-relaxed text-slate-600 mb-10">
                 Türkiye otomobil pazarında 2024 yılının ilk çeyreği, beklenen fiyat dengelenmesinin ötesinde bir veri seti sundu. İkinci el piyasasındaki hareketlilik, özellikle düşük kilometreli ve yetkili servis bakımlı araçlarda yoğunlaşmaya devam ediyor.
               </p>
               
               <h2 className="text-3xl">Dijitalleşen Pazar Dinamikleri</h2>
               <p>
                 İlan sayılarındaki artış, alıcılar için rasyonel seçim yapma imkanını genişletse de, güven faktörü hala en büyük belirleyici unsur. Showroom Elite standartlarımızla yaptığımız analizler gösteriyor ki; şeffaf ekspertiz raporu sunan ilanlar, sunmayanlara göre %40 daha hızlı sonuçlanıyor.
               </p>

               <div className="my-12 p-10 rounded-[3rem] bg-slate-50 border-l-8 border-primary italic space-y-4">
                  <p className="text-2xl font-black text-slate-900 leading-tight">&quot;Rakamlar yalan söylemez. 2024 model araçlarda fiyat-performans indeksi, geçtiğimiz yıla oranla %12 daha stabil bir seyir izliyor.&quot;</p>
                  <p className="text-sm font-bold text-primary">— Otoburada Veri Analizi Ekibi</p>
               </div>

               <h2 className="text-3xl">Yatırımcı Gözüyle 2024</h2>
               <p>
                 Sadece bir ulaşım aracı değil, aynı zamanda bir değer saklama aracı olarak görülen otomobillerde, marka sadakati yerini &quot;ekspertiz temizliği&quot;ne bırakıyor. Özellikle elektrikli araç segmentindeki büyüme hızı, hibrit modellerin pazar payını zorlamaya başladı.
               </p>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-6 pt-10 border-t border-slate-100 italic">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BU İÇERİĞİ PAYLAŞ:</span>
               <div className="flex gap-3">
                  <button className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Globe size={18} /></button>
                  <button className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Share2 size={18} /></button>
                  <button className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><LinkIcon size={18} /></button>
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-12">
            {/* Sidebar Widget: Featured Listing */}
            <div className="bg-slate-950 rounded-[3rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-200">
               <ShieldCheck className="text-primary size-10" />
               <h3 className="text-xl font-black italic uppercase tracking-tighter">İLANINI ANALİZ ET</h3>
               <p className="text-xs font-medium text-slate-400 italic leading-relaxed">Piyasa verilerine göre aracının güncel değerini öğrenmek ister misin?</p>
               <Link 
                 href="/dashboard/listings/create" 
                 className="h-14 w-full rounded-2xl bg-primary text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all italic"
               >
                 DEĞERLEMEYE BAŞLA
               </Link>
            </div>

            {/* Related Posts */}
            <div className="space-y-6">
               <h3 className="text-xs font-black italic uppercase tracking-widest text-slate-400">BENZER OKUMALAR</h3>
               <div className="space-y-6">
                  <RelatedPostItem 
                    title="Expertiz Raporu Okuma Kılavuzu" 
                    date="10 Nisan 2024"
                    image="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2082&auto=format&fit=crop"
                  />
                  <RelatedPostItem 
                    title="Elektrikli Araçlarda Batarya Sağlığı" 
                    date="08 Nisan 2024"
                    image="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop"
                  />
               </div>
            </div>
         </div>
      </div>
    </article>
  );
}

function RelatedPostItem({ title, date, image }: { title: string, date: string, image: string }) {
  return (
    <Link href="#" className="flex items-center gap-4 group">
       <div className="size-20 shrink-0 rounded-2xl bg-slate-100 relative overflow-hidden shadow-sm">
          <Image src={image} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
       </div>
       <div className="space-y-1">
          <h4 className="text-xs font-black italic uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{date}</p>
       </div>
    </Link>
  );
}

function ShieldCheck({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8l3 3-3 3" />
      <path d="M9 12h6" />
    </svg>
  );
}
