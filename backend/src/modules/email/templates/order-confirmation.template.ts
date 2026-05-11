interface OrderItemLite {
  productName: string;
  unitPrice: number | string;
  quantity: number;
  subtotal: number | string;
}

interface ShippingSnapshot {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string | null;
}

interface Params {
  fullName: string;
  orderNumber: string;
  currency: string;
  subtotal: number | string;
  shippingFee: number | string;
  discountCode?: string | null;
  discountAmount?: number | string | null;
  total: number | string;
  taxRate?: number | string | null;
  taxAmount?: number | string | null;
  items: OrderItemLite[];
  shippingSnapshot: ShippingSnapshot;
  orderUrl: string;
}

const fmt = (value: number | string | null | undefined, currency: string) => {
  const n = Number(value ?? 0);
  return `${currency}${n.toFixed(2)}`;
};

export function orderConfirmationTemplate(p: Params): { html: string; text: string } {
  const itemsTextLines = p.items
    .map((it) => `  • ${it.productName} (×${it.quantity}) — ${fmt(it.subtotal, p.currency)}`)
    .join('\n');

  const text = `Bonjour ${p.fullName},

Merci pour votre commande Makani Cosmétique ! Nous avons bien reçu votre paiement.

Numéro de commande : ${p.orderNumber}

Articles :
${itemsTextLines}

Sous-total : ${fmt(p.subtotal, p.currency)}
Livraison : ${Number(p.shippingFee) === 0 ? 'Offerte' : fmt(p.shippingFee, p.currency)}
${p.discountAmount && Number(p.discountAmount) > 0 ? `Réduction (${p.discountCode}) : −${fmt(p.discountAmount, p.currency)}\n` : ''}Total : ${fmt(p.total, p.currency)}

Adresse de livraison :
${p.shippingSnapshot.fullName ?? ''}
${p.shippingSnapshot.line1 ?? ''}${p.shippingSnapshot.line2 ? ', ' + p.shippingSnapshot.line2 : ''}
${p.shippingSnapshot.postalCode ?? ''} ${p.shippingSnapshot.city ?? ''}
${p.shippingSnapshot.country ?? ''}

Suivez votre commande : ${p.orderUrl}

— L'équipe Makani Cosmétique`;

  const itemsHtml = p.items.map((it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;font-size:14px;color:#1a1a1a;">
        ${escapeHtml(it.productName)}
        <div style="color:#888;font-size:12px;margin-top:2px;">${fmt(it.unitPrice, p.currency)} × ${it.quantity}</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;font-size:14px;color:#C44D3A;font-weight:600;text-align:right;white-space:nowrap;">${fmt(it.subtotal, p.currency)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Confirmation de commande</title>
  </head>
  <body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
            <tr>
              <td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#ffffff;">
                <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;letter-spacing:0.02em;">Makani Cosmétique</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 8px;">
                <h2 style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#1a1a1a;">Merci ${escapeHtml(p.fullName)} !</h2>
                <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#444;">
                  Nous avons bien reçu votre commande et votre paiement a été confirmé.
                </p>
                <p style="margin:0 0 24px;font-size:14px;color:#888;">
                  Numéro de commande : <strong style="color:#C44D3A;">${escapeHtml(p.orderNumber)}</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 40px;">
                <h3 style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#1a1a1a;">Articles</h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsHtml}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 40px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#444;">
                  <tr>
                    <td style="padding:6px 0;">Sous-total</td>
                    <td style="padding:6px 0;text-align:right;">${fmt(p.subtotal, p.currency)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">Livraison</td>
                    <td style="padding:6px 0;text-align:right;">${Number(p.shippingFee) === 0 ? 'Offerte' : fmt(p.shippingFee, p.currency)}</td>
                  </tr>
                  ${p.discountAmount && Number(p.discountAmount) > 0 ? `
                  <tr>
                    <td style="padding:6px 0;color:#0a6640;">Réduction (${escapeHtml(p.discountCode ?? '')})</td>
                    <td style="padding:6px 0;text-align:right;color:#0a6640;">−${fmt(p.discountAmount, p.currency)}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:14px 0 6px;border-top:1px solid #f0ebe4;font-size:16px;color:#1a1a1a;font-weight:600;">Total TTC</td>
                    <td style="padding:14px 0 6px;border-top:1px solid #f0ebe4;text-align:right;font-size:16px;color:#C44D3A;font-weight:700;">${fmt(p.total, p.currency)}</td>
                  </tr>
                  ${p.taxAmount && Number(p.taxAmount) > 0 ? `
                  <tr>
                    <td colspan="2" style="padding:0 0 4px;text-align:right;font-size:12px;color:#888;">
                      dont TVA (${Number(p.taxRate ?? 0).toFixed(0)}%) : ${fmt(p.taxAmount, p.currency)}
                    </td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 40px 8px;">
                <h3 style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#1a1a1a;">Adresse de livraison</h3>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#444;">
                  <strong style="color:#1a1a1a;">${escapeHtml(p.shippingSnapshot.fullName ?? '')}</strong><br/>
                  ${escapeHtml(p.shippingSnapshot.line1 ?? '')}${p.shippingSnapshot.line2 ? '<br/>' + escapeHtml(p.shippingSnapshot.line2) : ''}<br/>
                  ${escapeHtml(p.shippingSnapshot.postalCode ?? '')} ${escapeHtml(p.shippingSnapshot.city ?? '')}<br/>
                  ${escapeHtml(p.shippingSnapshot.country ?? '')}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 40px 32px;text-align:center;">
                <a href="${p.orderUrl}" style="display:inline-block;background:#C44D3A;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                  Suivre ma commande
                </a>
                <p style="margin:18px 0 0;font-size:13px;color:#888;line-height:1.6;">
                  Une question ? Répondez simplement à cet email, nous lisons chaque message.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 40px;background:#fafaf8;text-align:center;font-size:12px;color:#999;">
                Makani Cosmétique · Soins capillaires, peau & parfums
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
