"use client"

import Link from "next/link"
import { CheckCircle2, Lock } from "lucide-react"
import { EIDSBadge } from "@/components/shared/eids-badge"
import { TrustBadge } from "@/components/shared/trust-badge"
import { ContactActions } from "@/components/listings/contact-actions"
import type { Profile } from "@/types"

interface SellerCardProps {
  seller: Profile | null
  trustSummary: {
    badgeLabel: string
    score: number
    signals: string[]
  }
  isLoggedIn: boolean
  listingId: string
  loginUrl: string
}

export function SellerCard({
  seller,
  trustSummary,
  isLoggedIn,
  listingId,
  loginUrl,
}: SellerCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-5">
        {/* Seller Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg border border-slate-200">
            {(seller?.fullName ?? "S").slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{seller?.fullName ?? "Satıcı"}</span>
              <EIDSBadge isVerified={!!seller?.eidsId} />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Bireysel Satıcı
            </span>
          </div>
        </div>

        {/* Trust Badge */}
        <TrustBadge
          badgeLabel={trustSummary.badgeLabel}
          score={trustSummary.score}
        />

        {/* Contact Actions */}
        {isLoggedIn ? (
          <div className="mt-4">
            <ContactActions listingId={listingId} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-center">
              <Lock className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">
                İletişim bilgilerini görmek için
              </p>
              <Link
                href={loginUrl}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
            <p className="text-xs text-center text-slate-500">
              veya <Link href="/register" className="text-blue-600 hover:underline">kayıt ol</Link> ücretsiz ilan oluştur
            </p>
          </div>
        )}

        {/* Trust Signals */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-900 mb-2">Güven Sinyalleri</p>
          {trustSummary.signals.length > 0 ? (
            <ul className="space-y-2">
              {trustSummary.signals.map((signal) => (
                <li key={signal} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {signal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Satıcı henüz ek güven sinyali paylaşmadı.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}