/**
 * Email Templates — Transactional email HTML generator functions.
 */

export function ticketReplyHtml(p: {
  toName: string;
  ticketSubject: string;
  adminResponse: string;
  ticketUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Destek Ekibi</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 24px;color:#0f172a;font-size:20px;font-weight:900;">Destek talebinize yanıt verildi</h2>
            
            <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Konu</p>
              <p style="margin:4px 0 0;color:#0f172a;font-size:15px;font-weight:700;">${p.ticketSubject}</p>
            </div>

            <div style="border-left:4px solid #2563eb;padding:16px 20px;background:#eff6ff;border-radius:0 12px 12px 0;margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Destek Ekibinin Yanıtı</p>
              <p style="margin:0;color:#1e3a5f;font-size:15px;line-height:1.6;">${p.adminResponse.replace(/\n/g, "<br>")}</p>
            </div>

            <a href="${p.ticketUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;letter-spacing:0.5px;">
              Destek Taleplerime Git →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} destek sistemi tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ticketCreatedHtml(p: {
  toName: string;
  ticketSubject: string;
  ticketUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Destek Ekibi</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900;">Destek talebiniz alındı ✓</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              <strong>"${p.ticketSubject}"</strong> konulu destek talebiniz ekibimize iletildi. En kısa sürede yanıt vereceğiz.
            </p>
            <a href="${p.ticketUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;">
              Talebi Görüntüle →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} destek sistemi tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface SavedSearchAlertListing {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  slug: string;
  imageUrl?: string;
}

export function savedSearchAlertHtml(p: {
  toName: string;
  searchTitle: string;
  searchUrl: string;
  newListings: SavedSearchAlertListing[];
  appUrl: string;
  appName: string;
}): string {
  const listingCards = p.newListings
    .slice(0, 5)
    .map(
      (l) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:16px;vertical-align:top;">
              <p style="margin:0;font-size:14px;font-weight:800;color:#0f172a;">${l.brand} ${l.model} ${l.year}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${l.title}</p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">${l.city}</p>
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;">
              <p style="margin:0;font-size:16px;font-weight:900;color:#2563eb;">${new Intl.NumberFormat("tr-TR").format(l.price)} TL</p>
              <a href="${p.appUrl}/listing/${l.slug}" style="display:inline-block;margin-top:6px;background:#eff6ff;color:#2563eb;text-decoration:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;">
                İncele →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2563eb;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Kayıtlı Arama Bildirimi</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:900;">
              ${p.newListings.length} yeni araç bulundu
            </h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;">
              "<strong>${p.searchTitle}</strong>" aramanıza uygun yeni ilanlar eklendi.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${listingCards}
            </table>
            ${p.newListings.length > 5 ? `<p style="margin:16px 0 0;color:#64748b;font-size:13px;">ve ${p.newListings.length - 5} araç daha...</p>` : ""}
            <div style="margin-top:32px;">
              <a href="${p.searchUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;">
                Tüm Sonuçları Gör →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Bu bildirimi almak istemiyorsanız 
              <a href="${p.appUrl}/dashboard/saved-searches" style="color:#2563eb;">kayıtlı aramalarınızı</a> 
              yönetebilirsiniz.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function listingApprovedHtml(p: {
  toName: string;
  listingTitle: string;
  listingUrl: string;
  dashboardUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#059669;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#a7f3d0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">İlan Onaylandı ✓</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900;">İlanın yayınlandı! 🎉</h2>
            <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #bbf7d0;">
              <p style="margin:0;color:#166534;font-size:15px;font-weight:700;">${p.listingTitle}</p>
            </div>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
              İlanın moderasyon incelemesinden geçti ve artık tüm kullanıcılara görünür. Alıcılardan mesaj almaya başlayabilirsin.
            </p>
            <div style="display:flex;gap:12px;">
              <a href="${p.listingUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:800;margin-right:12px;">
                İlanı Görüntüle →
              </a>
              <a href="${p.dashboardUrl}" style="display:inline-block;background:#f1f5f9;color:#475569;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;">
                Panele Git
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function listingRejectedHtml(p: {
  toName: string;
  listingTitle: string;
  reason?: string;
  dashboardUrl: string;
  appName: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#dc2626;padding:32px 40px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">${p.appName}</p>
            <p style="margin:4px 0 0;color:#fca5a5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">İlan İnceleme Sonucu</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Merhaba ${p.toName},</p>
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900;">İlanın yayınlanamadı</h2>
            <div style="background:#fef2f2;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid #fecaca;">
              <p style="margin:0;color:#991b1b;font-size:15px;font-weight:700;">${p.listingTitle}</p>
            </div>
            ${p.reason ? `
            <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 12px 12px 0;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#9a3412;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Moderasyon Notu</p>
              <p style="margin:0;color:#7c2d12;font-size:14px;line-height:1.6;">${p.reason}</p>
            </div>` : ""}
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
              İlanını düzenleyerek tekrar gönderebilirsin. Sorularınız için destek ekibimizle iletişime geçebilirsin.
            </p>
            <a href="${p.dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;">
              İlanlarıma Git →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Bu e-posta ${p.appName} tarafından otomatik gönderilmiştir.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
