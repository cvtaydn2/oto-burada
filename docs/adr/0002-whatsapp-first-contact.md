# ADR 002: WhatsApp-first Contact Model

## Durum

Kabul Edildi

## Bağlam

İkinci el araç pazarında alıcı ve satıcı arasındaki iletişim hızı ve güven çok önemlidir. İçeride bir mesajlaşma sistemi kurmak; bildirim yönetimi, spam kontrolü ve kullanıcıyı platformda tutma gibi zorlukları beraberinde getirir.

## Karar

MVP aşamasında birincil iletişim kanalı olarak **WhatsApp CTA (Call to Action)** seçilmiştir. Kullanıcılar bir ilana ilgi duyduklarında doğrudan satıcının WhatsApp hattına yönlendirilirler.

## Sonuçlar

- **Hız:** Alıcı ve satıcı zaten hakim oldukları bir platformda anında iletişime geçer.
- **Düşük Karmaşıklık:** Real-time chat altyapısı, push notification ve mesaj depolama yükü sistemden kaldırıldı.
- **Yüksek Dönüşüm:** Türkiye pazarında WhatsApp kullanımı alışkanlığı, conversion oranlarını artırır.

## Trade-off’lar

- **Platform Kontrolü:** İletişim platform dışına sızdığı için konuşma içeriklerini denetlemek veya analiz etmek mümkün değildir.
- **Privacy:** Satıcıların telefon numaraları (WhatsApp üzerinden) paylaşılmaktadır. Gizliliği önemseyen kullanıcılar için bu bir engel olabilir (İleride maskeleme gerekebilir).
