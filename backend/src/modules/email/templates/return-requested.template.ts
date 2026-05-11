interface ItemLite {
  productName: string;
  unitPrice: number | string;
  quantity: number;
}

interface Params {
  fullName: string;
  orderNumber: string;
  items: ItemLite[];
  reason: string;
  orderUrl: string;
}

export function returnRequestedTemplate(p: Params): { html: string; text: string } {
  const itemsText = p.items.map((it) => `  • ${it.productName} (×${it.quantity})`).join('\n');
  const text = `Bonjour ${p.fullName},

Nous avons bien reçu votre demande de retour pour la commande ${p.orderNumber}.

Articles concernés :
${itemsText}

Motif : ${p.reason}

Notre équipe va l examiner et vous tiendra informé(e) sous 48 heures ouvrées.

Détails de la commande : ${p.orderUrl}

— L'équipe Makani Cosmétique`;

  const itemsHtml = p.items.map((it) => `
    <li style="padding:6px 0;font-size:14px;color:#444;">
      ${escapeHtml(it.productName)} <span style="color:#888;">— ×${it.quantity}</span>
    </li>`).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Demande de retour reçue</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
<tr><td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#fff;">
<h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;">Makani Cosmétique</h1>
</td></tr>
<tr><td style="padding:36px 40px 8px;">
<h2 style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#1a1a1a;">Demande de retour bien reçue</h2>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">Bonjour ${escapeHtml(p.fullName)},</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444;">
Nous avons bien reçu votre demande de retour pour la commande <strong style="color:#C44D3A;">${escapeHtml(p.orderNumber)}</strong>.
Notre équipe va l examiner et vous tiendra informé(e) sous 48 heures ouvrées.
</p>
<h3 style="margin:20px 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:600;">Articles concernés</h3>
<ul style="list-style:none;margin:0;padding:0 0 12px;border-bottom:1px solid #f0ebe4;">${itemsHtml}</ul>
<h3 style="margin:20px 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:600;">Motif</h3>
<p style="margin:0;padding:12px 14px;background:#fafaf8;border-radius:8px;font-size:13px;color:#444;line-height:1.5;">${escapeHtml(p.reason)}</p>
</td></tr>
<tr><td style="padding:24px 40px 32px;text-align:center;">
<a href="${p.orderUrl}" style="display:inline-block;background:#C44D3A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">Voir ma commande</a>
</td></tr>
<tr><td style="padding:20px 40px;background:#fafaf8;text-align:center;font-size:12px;color:#999;">Makani Cosmétique · Soins capillaires, peau & parfums</td></tr>
</table></td></tr></table></body></html>`;

  return { html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
