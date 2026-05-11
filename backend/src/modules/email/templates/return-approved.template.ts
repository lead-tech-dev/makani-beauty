interface Params {
  fullName: string;
  orderNumber: string;
  refundAmount: number;
  currency: string;
  orderUrl: string;
}

export function returnApprovedTemplate(p: Params): { html: string; text: string } {
  const amount = `${p.currency}${Number(p.refundAmount).toFixed(2)}`;

  const text = `Bonjour ${p.fullName},

Bonne nouvelle : votre demande de retour pour la commande ${p.orderNumber} est approuvée.

Un remboursement de ${amount} a été initié vers votre moyen de paiement initial.
Le crédit apparaîtra sur votre compte sous 5 à 10 jours ouvrés selon votre banque.

Détails de la commande : ${p.orderUrl}

— L'équipe Makani Cosmétique`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Retour approuvé</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
<tr><td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#fff;">
<h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:600;">Makani Cosmétique</h1>
</td></tr>
<tr><td style="padding:36px 40px 16px;text-align:center;">
<div style="font-size:42px;line-height:1;">✅</div>
<h2 style="margin:14px 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#1a1a1a;">Retour approuvé</h2>
<p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.55;">
Bonjour ${escapeHtml(p.fullName)}, votre demande de retour pour la commande
<strong style="color:#C44D3A;">${escapeHtml(p.orderNumber)}</strong> est validée.
</p>
</td></tr>
<tr><td style="padding:0 40px 8px;">
<div style="padding:16px 18px;background:#e6f7ee;border:1px solid #b8e2c8;border-radius:10px;text-align:center;">
<span style="font-size:13px;color:#0a6640;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">Remboursement</span><br/>
<strong style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#0a6640;">${escapeHtml(amount)}</strong>
</div>
<p style="margin:16px 0 0;font-size:13px;color:#666;line-height:1.55;text-align:center;">
Le crédit apparaît sur votre relevé sous 5 à 10 jours ouvrés selon votre banque.
</p>
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
