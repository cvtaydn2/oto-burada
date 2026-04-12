import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGalleryBySlug } from "@/services/gallery"
import { GalleryHeader } from "@/components/layout/gallery-header"
import { CarCard } from "@/components/modules/listings/car-card"
import { Badge } from "@/components/ui/badge"
import { Car } from "lucide-react"

interface GalleryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getGalleryBySlug(slug)
  if (!data) return { title: "Galeri Bulunamadı | OtoBurada" }

  const name = data.profile.businessName || data.profile.fullName
  return {
    title: `${name} | OtoBurada Kurumsal Galeri`,
    description: data.profile.businessDescription || `${name} galerisinin tüm araç ilanlarını keşfedin.`,
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params
  const data = await getGalleryBySlug(slug)
  
  if (!data) {
    notFound()
  }

  const { profile, listings } = data

  return (
    <div className="min-h-screen bg-slate-50/50">
      <GalleryHeader profile={profile} />
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="size-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Car size={20} />
             </div>
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                Galerinin <span className="text-primary">İlanları</span>
             </h2>
          </div>
          <Badge variant="outline" className="border-slate-300 text-slate-600 font-bold px-3 py-1 bg-white">
            {listings.length} ARAÇ
          </Badge>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <CarCard 
                key={listing.id} 
                listing={listing} 
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-border rounded-[32px] card-shadow">
             <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Car size={40} />
             </div>
             <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">Henüz İlan Mevcut Değil</h3>
             <p className="text-sm font-medium text-slate-400 max-w-xs mt-1">
                Bu galeri henüz aktif bir araç ilanı eklememiş.
             </p>
          </div>
        )}
      </main>
    </div>
  )
}
