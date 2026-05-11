interface Params {
  fullName: string;
  verifyUrl: string;
}

export function emailVerificationTemplate({ fullName, verifyUrl }: Params): { html: string; text: string } {
  const text = `Bonjour ${fullName},

Bienvenue chez Makani Cosmétique ! Confirmez votre adresse email en cliquant sur le lien ci-dessous (valable 24h) :
${verifyUrl}

Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.

— L'équipe Makani Cosmétique`;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>Confirmer votre email</title></head>
  <body style="margin:0;padding:0;background:#f9f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,61,49,0.08);">
          <tr><td style="padding:32px 40px 24px;text-align:center;background:#C44D3A;color:#ffffff;">
            <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;letter-spacing:0.02em;">Makani Cosmétique</h1>
          </td></tr>
          <tr><td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a;">Bienvenue ${escapeHtml(fullName)} !</h2>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
              Confirmez votre adresse email pour activer toutes les fonctionnalités de votre compte&nbsp;:
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:#C44D3A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Confirmer mon email
              </a>
            </div>
            <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#888;">
              Ce lien est valable <strong>24 heures</strong>. Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:
            </p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#C44D3A;">
              <a href="${verifyUrl}" style="color:#C44D3A;">${verifyUrl}</a>
            </p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#888;border-top:1px solid #f0ebe4;padding-top:20px;">
              Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
            </p>
          </td></tr>
          <tr><td style="padding:20px 40px;background:#fafaf8;text-align:center;font-size:12px;color:#999;">
            Makani Cosmétique · Soins capillaires, peau & parfums
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
