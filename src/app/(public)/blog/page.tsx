import { Calendar, Clock, User, ChevronRight, Search, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "2024 Model Yılı Araç Değerleme Raporu",
      excerpt: "İkinci el otomobil piyasasındaki son fiyat değişimleri ve gelecek projeksiyonları üzerine detaylı analiz.",
      category: "Pazar Analizi",
      author: "OtoBurada Ekibi",
      date: "12 Nisan 2024",
      readTime: "8 dk",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Ekspertiz Raporu Okuma Kılavuzu",
      excerpt: "Boya, değişen ve tramer kayıtları arasındaki ince farkları anlamak için hazırladığımız kapsamlı rehber.",
      category: "Rehber",
      author: "Ali Teknik",
      date: "10 Nisan 2024",
      readTime: "12 dk",
      image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2082&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Elektrikli Araçlarda Batarya Sağlığı",
      excerpt: "İkinci el elektrikli otomobil alırken batarya verilerini nasıl kontrol etmelisiniz?",
      category: "Teknoloji",
      author: "Elif Bataryacı",
      date: "08 Nisan 2024",
      readTime: "6 dk",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop"
    }
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Blog Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
           <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">OtoBurada Akademi</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-tight text-slate-900 uppercase italic">
              INSIGHT <span className="text-primary text-3xl md:text-5xl block mt-2">& ARŞİV</span>
           </h1>
           <p className="mt-6 text-sm font-medium text-slate-400 italic leading-relaxed">
              Otomobil dünyasındaki güncel veriler, teknik rehberler ve sektör analizleri ile rasyonel kararlar verin.
           </p>
        </div>
        <div className="flex-1 max-w-md">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Blog makalelerinde ara..." 
                className="h-14 w-full pl-12 pr-6 rounded-2xl bg-white border-2 border-slate-100 focus:border-primary outline-none transition-all font-bold italic text-sm" 
              />
           </div>
        </div>
      </div>

      {/* Featured Post */}
      <Link href={`/blog/${posts[0].id}`} className="block group">
        <div className="relative h-[500px] w-full rounded-[3rem] overflow-hidden shadow-3xl shadow-slate-200/50 transition-all group-hover:shadow-primary/10">
            <Image src={posts[0].image} alt={posts[0].title} fill priority sizes="100vw" className="object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent z-10" />
           <div className="absolute bottom-0 left-0 p-8 lg:p-16 z-20 space-y-6">
              <span className="inline-flex px-4 py-2 rounded-xl bg-primary text-[10px] font-black text-white uppercase tracking-widest italic">ÖNE ÇIKAN</span>
              <h2 className="text-3xl lg:text-5xl font-black italic uppercase tracking-tighter text-white max-w-3xl leading-tight">
                {posts[0].title}
              </h2>
              <div className="flex items-center gap-6 text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                 <div className="flex items-center gap-2"><User size={14} /> {posts[0].author}</div>
                 <div className="flex items-center gap-2"><Calendar size={14} /> {posts[0].date}</div>
                 <div className="flex items-center gap-2"><Clock size={14} /> {posts[0].readTime} OKUMA</div>
              </div>
           </div>
        </div>
      </Link>

      {/* Blog Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
         {posts.slice(1).map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="group space-y-6">
               <div className="relative aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl shadow-slate-200/20">
                   <Image src={post.image} alt={post.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-black text-slate-900 uppercase tracking-widest italic">
                     {post.category}
                  </div>
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-400 italic line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {post.date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readTime}</span>
                     </div>
                     <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <ChevronRight size={18} />
                     </div>
                  </div>
               </div>
            </Link>
         ))}
      </div>

      {/* Newsletter */}
      <div className="bg-slate-950 rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden text-center">
         <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -ml-32 -mt-32" />
         <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <Tag className="text-primary size-12 mx-auto rotate-12" />
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">HABERDAR <span className="text-primary italic">KALIN</span></h2>
            <p className="text-slate-400 font-medium italic leading-relaxed">
              Piyasa raporları ve kaçırılmayacak fırsatlar haftalık olarak e-posta kutunuzda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
               <input 
                 type="email" 
                 placeholder="E-posta adresiniz" 
                 className="h-16 flex-1 px-8 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold focus:bg-white/10 outline-none transition-all italic" 
               />
               <button className="h-16 px-10 rounded-2xl bg-white text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all italic">
                 KAYDOL
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
