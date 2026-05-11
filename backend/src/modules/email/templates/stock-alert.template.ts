interface StockProduct {
  name: string;
  sku?: string | null;
  stock: number;
  stockAlert: number;
}

interface DigestParams {
  kind: 'digest';
  outOfStock: StockProduct[];
  lowStock: StockProduct[];
  adminUrl: string;
}

interface RuptureParams {
  kind: 'rupture';
  product: StockProduct;
  adminUrl: string;
  orderNumber?: string;
}

type Params = DigestParams | RuptureParams;

export function stockAlertTemplate(p: Params): { html: string; text: string; subject: string } {
  if (p.kind === 'rupture') return ruptureBody(p);
  return digestBody(p);
}

function ruptureBody(p: RuptureParams): { html: string; text: string; subject: string } {
  const subject = `🔴 Rupture de stock : ${p.product.name}`;

  const text = `Le produit suivant vient de passer en rupture de stock :

${p.product.name}${p.product.sku ? ` (SKU : ${p.product.sku})` : ''}
Stock actuel : 0
${p.orderNumber ? `Déclencheur : commande ${p.orderNumber}\n` : ''}

Pensez à réapprovisionner rapidement pour ne pas perdre de ventes.

Voir le produit : ${p.adminUrl}

— Makani Cosmétique (alertes automatiques)`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Rupture de stock</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
<tr><td style="padding:32px 40px 24px;text-align:center;background:#a3392b;color:#fff;">
<div style="font-size:34px;line-height:1;margin-bottom:6px;">🔴</div>
<h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;">Rupture de stock</h1>
</td></tr>
<tr><td style="padding:32px 40px 8px;">
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#444;">
Le produit suivant vient de passer à <strong style="color:#a3392b;">0 stock</strong> :
</p>
<div style="padding:14px 16px;background:#fdf0ef;border:1px solid #f4c8c4;border-radius:10px;margin:0 0 16px;">
<strong style="font-size:1.05rem;color:#1a1a1a;">${escapeHtml(p.product.name)}</strong>
${p.product.sku ? `<br/><span style="font-size:13px;color:#888;">SKU : <code>${escapeHtml(p.product.sku)}</code></span>` : ''}
</div>
${p.orderNumber ? `<p style="margin:0 0 16px;font-size:13px;color:#888;">Déclencheur : commande <strong style="color:#C44D3A;">${escapeHtml(p.orderNumber)}</strong></p>` : ''}
<p style="margin:0 0 16px;font-size:13px;color:#666;line-height:1.5;">
Pensez à réapprovisionner rapidement pour ne pas perdre de ventes.
</p>
</td></tr>
<tr><td style="padding:8px 40px 32px;text-align:center;">
<a href="${p.adminUrl}" style="display:inline-block;background:#C44D3A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">Réapprovisionner</a>
</td></tr>
<tr><td style="padding:20px 40px;background:#fafaf8;text-align:center;font-size:11px;color:#999;">
Makani Cosmétique · Alertes stock automatiques
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html };
}

function digestBody(p: DigestParams): { html: string; text: string; subject: string } {
  const total = p.outOfStock.length + p.lowStock.length;
  const subject = total === 0
    ? 'Stock OK — aucune alerte'
    : `📦 ${total} alerte${total > 1 ? 's' : ''} stock à traiter`;

  const lineText = (sp: StockProduct) =>
    `  • ${sp.name}${sp.sku ? ` (${sp.sku})` : ''} — stock ${sp.stock} (seuil ${sp.stockAlert})`;

  const text = `Bonjour,

${p.outOfStock.length > 0 ? `🔴 EN RUPTURE (${p.outOfStock.length}) :\n${p.outOfStock.map(lineText).join('\n')}\n\n` : ''}${p.lowStock.length > 0 ? `🟡 STOCK BAS (${p.lowStock.length}) :\n${p.lowStock.map(lineText).join('\n')}\n\n` : ''}${total === 0 ? 'Aucun produit ne nécessite votre attention aujourd hui.\n\n' : ''}Voir la liste complète : ${p.adminUrl}

— Makani Cosmétique (alertes automatiques)`;

  const lineHtml = (sp: StockProduct, color: string) => `
    <tr style="border-top:1px solid #f0ebe4;">
      <td style="padding:10px 12px;font-size:13.5px;color:#1a1a1a;">
        <strong>${escapeHtml(sp.name)}</strong>
        ${sp.sku ? `<br/><span style="font-size:11px;color:#888;">SKU : <code>${escapeHtml(sp.sku)}</code></span>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;color:${color};white-space:nowrap;">
        ${sp.stock} <span style="color:#888;font-weight:400;">/ seuil ${sp.stockAlert}</span>
      </td>
    </tr>`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Récap stock</title></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
<tr><td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#fff;">
<h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;">Récap stock du jour</h1>
<p style="margin:8px 0 0;font-size:13px;color:#bdd2c8;">${formatDate(new Date())}</p>
</td></tr>

${total === 0 ? `
<tr><td style="padding:32px 40px;text-align:center;">
<div style="font-size:38px;line-height:1;">✅</div>
<h2 style="margin:14px 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:#0a6640;">Tous les stocks sont OK</h2>
<p style="margin:0;font-size:14px;color:#666;line-height:1.55;">Aucun produit ne nécessite votre attention aujourd hui.</p>
</td></tr>
` : `
${p.outOfStock.length > 0 ? `
<tr><td style="padding:24px 40px 4px;">
<div style="display:inline-block;padding:4px 12px;background:#fdf0ef;color:#a3392b;border:1px solid #f4c8c4;border-radius:999px;font-size:12px;font-weight:600;">
🔴 En rupture · ${p.outOfStock.length}
</div>
</td></tr>
<tr><td style="padding:8px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe4;border-radius:10px;overflow:hidden;">
${p.outOfStock.map((sp) => lineHtml(sp, '#a3392b')).join('')}
</table>
</td></tr>
` : ''}

${p.lowStock.length > 0 ? `
<tr><td style="padding:20px 40px 4px;">
<div style="display:inline-block;padding:4px 12px;background:#fff7e0;color:#8a4a00;border:1px solid #ffe5a3;border-radius:999px;font-size:12px;font-weight:600;">
🟡 Stock bas · ${p.lowStock.length}
</div>
</td></tr>
<tr><td style="padding:8px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe4;border-radius:10px;overflow:hidden;">
${p.lowStock.map((sp) => lineHtml(sp, '#c97a00')).join('')}
</table>
</td></tr>
` : ''}
`}

<tr><td style="padding:24px 40px 32px;text-align:center;">
<a href="${p.adminUrl}" style="display:inline-block;background:#C44D3A;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">Voir la liste complète</a>
</td></tr>
<tr><td style="padding:20px 40px;background:#fafaf8;text-align:center;font-size:11px;color:#999;">
Makani Cosmétique · Alertes stock automatiques · ADMIN_ALERTS_ENABLED=false dans le .env pour désactiver
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
