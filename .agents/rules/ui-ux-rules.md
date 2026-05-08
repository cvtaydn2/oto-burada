---
trigger: always_on
---

# UI / UX RULES (OtoBurada)

- **Mobile-First**: Tasarımlar önce mobil için yapılmalıdır (touch target >= 44x44px, bottom drawers, tek elle kullanım).
- **Hız**: Hızlı LCP ve optimize görseller sağlayarak 3 etkileşimde filtreleme hedefini destekle.
- **Graceful Degradation**: Harici servisler (Supabase, Sentry, Resend) kotalarından dolayı kapandığında kullanıcıya "Sistem şu an yoğun, lütfen daha sonra tekrar deneyin" empty-state mesajı göster, beyaz ekranla çökmesine izin verme.
- **States**: Her interaktif ekranın Loading, Empty, Error, Disabled ve Success durumlarını açıkça yönet. White-screen yasaktır.
- **SEO UX**: Public detay sayfaları SSR uyumlu olmalı, dinamik metadata ve canonical URL barındırmalıdır.