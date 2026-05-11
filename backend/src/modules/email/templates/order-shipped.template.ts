interface ShippingSnapshot {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  postalCode?: string;
  city?: string;
  country?: string;
}

interface Params {
  fullName: string;
  orderNumber: string;
  shippingSnapshot: ShippingSnapshot;
  orderUrl: string;
  trackingUrl?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
}

export function orderShippedTemplate(p: Params): { html: string; text: string } {
  const text = `Bonjour ${p.fullName},

Bonne nouvelle : votre commande ${p.orderNumber} a été expédiée !

Adresse de livraison :
${p.shippingSnapshot.fullName ?? ''}
${p.shippingSnapshot.line1 ?? ''}${p.shippingSnapshot.line2 ? ', ' + p.shippingSnapshot.line2 : ''}
${p.shippingSnapshot.postalCode ?? ''} ${p.shippingSnapshot.city ?? ''}
${p.shippingSnapshot.country ?? ''}

${p.trackingUrl ? `Suivre le colis : ${p.trackingUrl}\n` : ''}Détails de la commande : ${p.orderUrl}

— L'équipe Makani Cosmétique`;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Votre commande a été expédiée</title>
  </head>
  <body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
            <tr>
              <td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#ffffff;">
                <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;letter-spacing:0.02em;">Makani Cosmétique</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 16px;text-align:center;">
                <div style="font-size:42px;line-height:1;">📦</div>
                <h2 style="margin:14px 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;color:#1a1a1a;">
                  Votre commande est en route !
                </h2>
                <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.55;">
                  Bonjour ${escapeHtml(p.fullName)}, nous venons de remettre votre colis au transporteur.
                </p>
                <p style="margin:0;font-size:14px;color:#888;">
                  Commande : <strong style="color:#C44D3A;">${escapeHtml(p.orderNumber)}</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 40px 8px;">
                <h3 style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#1a1a1a;">Livraison à</h3>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:#444;">
                  <strong style="color:#1a1a1a;">${escapeHtml(p.shippingSnapshot.fullName ?? '')}</strong><br/>
                  ${escapeHtml(p.shippingSnapshot.line1 ?? '')}${p.shippingSnapshot.line2 ? '<br/>' + escapeHtml(p.shippingSnapshot.line2) : ''}<br/>
                  ${escapeHtml(p.shippingSnapshot.postalCode ?? '')} ${escapeHtml(p.shippingSnapshot.city ?? '')}<br/>
                  ${escapeHtml(p.shippingSnapshot.country ?? '')}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 40px 32px;text-align:center;">
                ${p.trackingUrl ? `
                <a href="${p.trackingUrl}" style="display:inline-block;background:#C44D3A;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:12px;">
                  Suivre mon colis
                </a><br/>` : ''}
                <a href="${p.orderUrl}" style="display:inline-block;background:#ffffff;color:#C44D3A;border:1.5px solid #C44D3A;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                  Voir ma commande
                </a>
                <p style="margin:18px 0 0;font-size:13px;color:#888;line-height:1.6;">
                  Vous recevrez un dernier email à la livraison.
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
