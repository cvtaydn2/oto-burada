# ADR 004: Capability-based Feature Gating

## Durum
Kabul Edildi

## Bağlam
Ürün geliştikçe "Chat", "PWA", "Karşılaştırma" gibi denerim aşamasındaki özellikler kod tabanına eklenmektedir. Bu özelliklerin ham veya eksik hallerinin tüm kullanıcılara açılması, MVP'nin "basit ve güvenli" odağını bozabilir.

## Karar
Tüm ikincil özellikler merkezi bir **Feature Flag (Module Gate)** sistemi (`src/lib/features.ts`) arkasına alınmıştır. Özellikler çevre değişkenleri (Env Vars) ile dinamik olarak açılıp kapatılabilir.

## Sonuçlar
- **Güvenli Yayın:** Geliştirme aşamasındaki özellikler üretim ortamında gizlenebilir.
- **Odaklanmış UX:** Pazarın ihtiyacına göre platformun yüzey alanı daraltılabilir veya genişletilebilir.
- **Staged Rollout:** Özelliklerin kademeli olarak (örneğin önce sadece adminlere) açılmasına olanak sağlar.

## Trade-off’lar
- **Kod Karmaşıklığı:** Kod içerisinde sürekli `if (features.xxx)` kontrolleri yapmak gürültü yaratabilir.
- **Bakım:** Zamanla "her zaman açık" hale gelen flaglerin temizlenmesi (Cleanup) disiplin gerektirir.
