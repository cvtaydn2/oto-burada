# ADR 003: Mandatory Admin Moderation

## Durum

Kabul Edildi

## Bağlam

OtoBurada sadece araç ilanlarına odaklanan bir niş pazardır. Kalitesiz ilanlar, sahte bilgiler veya dolandırıcılık girişimleri platformun itibarını ve kullanıcı güvenini hızlıca zedeleyebilir.

## Karar

Tüm yeni ilanlar ve güncellemeler başlangıçta `pending` durumunda kaydedilir ve bir **Admin Moderasyon** onayından geçmeden yayına alınmaz.

## Sonuçlar

- **Yüksek Kalite:** Sadece kriterlere uyan, fotoğrafları net ve bilgileri tutarlı ilanlar listelenir.
- **Güven:** Kullanıcılar "incelenmiş" ilanlara daha fazla güven duyar.
- **Spam Önleme:** Otomatik botların veya kötü niyetli kullanıcıların platformu kirletmesi engellenir.

## Trade-off’lar

- **Operasyonel Yük:** Her ilan için bir insanın müdahalesi gerekir. Bu, ilan sayısının çok arttığı durumlarda darboğaz yaratabilir. (İleride AI destekli ön-onay ile bu yük azaltılacaktır).
- **Yayın Süresi:** İlanların anında yayına girmemesi, bazı kullanıcılar için negatif bir deneyim olabilir.
