interface Params {
  fullName: string;
  resetUrl: string;
}

export function passwordResetTemplate({ fullName, resetUrl }: Params): { html: string; text: string } {
  const text = `Bonjour ${fullName},

Vous avez demandé la réinitialisation de votre mot de passe Makani Cosmétique.

Cliquez sur le lien suivant pour choisir un nouveau mot de passe (valable 1 heure) :
${resetUrl}

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

— L'équipe Makani Cosmétique`;

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Réinitialisation du mot de passe</title>
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
              <td style="padding:36px 40px 24px;">
                <h2 style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:#1a1a1a;">Bonjour ${escapeHtml(fullName)},</h2>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
                  Vous avez demandé la réinitialisation de votre mot de passe.
                  Cliquez sur le bouton ci-dessous pour en choisir un nouveau&nbsp;:
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:#C44D3A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                    Réinitialiser mon mot de passe
                  </a>
                </div>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#888;">
                  Ce lien est valable <strong>1 heure</strong>. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:
                </p>
                <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#C44D3A;">
                  <a href="${resetUrl}" style="color:#C44D3A;">${resetUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#888;border-top:1px solid #f0ebe4;padding-top:20px;">
                  Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre mot de passe restera inchangé.
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
