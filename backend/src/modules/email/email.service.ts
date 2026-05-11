import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { passwordResetTemplate } from './templates/password-reset.template';
import { emailVerificationTemplate } from './templates/email-verification.template';
import { orderConfirmationTemplate } from './templates/order-confirmation.template';
import { orderShippedTemplate } from './templates/order-shipped.template';
import { returnRequestedTemplate } from './templates/return-requested.template';
import { returnApprovedTemplate } from './templates/return-approved.template';
import { returnRejectedTemplate } from './templates/return-rejected.template';
import { stockAlertTemplate } from './templates/stock-alert.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT')) || 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.fromAddress = this.config.get<string>('MAIL_FROM_ADDRESS') ?? 'no-reply@makani-cosmetique.com';
    this.fromName = this.config.get<string>('MAIL_FROM_NAME') ?? 'Makani Cosmétique';
    this.enabled = !!host;

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`SMTP transporter ready (${host}:${port})`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to the console.');
    }
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(
        `\n──── 📧 Email (dev mode, not actually sent) ────\nTo: ${to}\nSubject: ${subject}\n\n${text ?? html}\n────────────────────────────────────────────────`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to,
      subject,
      html,
      text,
    });
  }

  async sendPasswordReset(to: string, fullName: string, resetUrl: string): Promise<void> {
    const { html, text } = passwordResetTemplate({ fullName, resetUrl });
    await this.send(to, 'Réinitialisation de votre mot de passe — Makani Cosmétique', html, text);
  }

  async sendEmailVerification(to: string, fullName: string, verifyUrl: string): Promise<void> {
    const { html, text } = emailVerificationTemplate({ fullName, verifyUrl });
    await this.send(to, 'Confirmez votre adresse email — Makani Cosmétique', html, text);
  }

  async sendOrderConfirmation(to: string, params: Parameters<typeof orderConfirmationTemplate>[0]): Promise<void> {
    const { html, text } = orderConfirmationTemplate(params);
    await this.send(to, `Commande confirmée — ${params.orderNumber}`, html, text);
  }

  async sendOrderShipped(to: string, params: Parameters<typeof orderShippedTemplate>[0]): Promise<void> {
    const { html, text } = orderShippedTemplate(params);
    await this.send(to, `Votre commande ${params.orderNumber} a été expédiée`, html, text);
  }

  async sendReturnRequested(to: string, params: Parameters<typeof returnRequestedTemplate>[0]): Promise<void> {
    const { html, text } = returnRequestedTemplate(params);
    await this.send(to, `Demande de retour reçue — ${params.orderNumber}`, html, text);
  }

  async sendReturnApproved(to: string, params: Parameters<typeof returnApprovedTemplate>[0]): Promise<void> {
    const { html, text } = returnApprovedTemplate(params);
    await this.send(to, `Votre retour est approuvé — ${params.orderNumber}`, html, text);
  }

  async sendReturnRejected(to: string, params: Parameters<typeof returnRejectedTemplate>[0]): Promise<void> {
    const { html, text } = returnRejectedTemplate(params);
    await this.send(to, `Votre demande de retour ${params.orderNumber}`, html, text);
  }

  async sendStockAlert(to: string, params: Parameters<typeof stockAlertTemplate>[0]): Promise<void> {
    const { html, text, subject } = stockAlertTemplate(params);
    await this.send(to, subject, html, text);
  }

  async sendAccountDeletionRequested(user: { email: string; fullName: string }, scheduledAt: Date): Promise<void> {
    const formattedDate = scheduledAt.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const html = `
      <p>Bonjour ${user.fullName},</p>
      <p>Nous avons bien reçu votre demande de suppression de compte sur Makani Cosmétique.</p>
      <p>Conformément au RGPD, vos données seront <strong>anonymisées le ${formattedDate}</strong>, soit 7 jours après votre demande. Pendant ce délai, vous pouvez encore vous reconnecter et annuler la demande depuis votre espace personnel.</p>
      <p>Notez que pour des raisons légales, nous conservons les factures et l historique de commandes pendant 10 ans (rattachés à un identifiant anonyme).</p>
      <p>Cordialement,<br/>L équipe Makani Cosmétique</p>
    `;
    const text = `Bonjour ${user.fullName},\n\nNous avons reçu votre demande de suppression. Vos données seront anonymisées le ${formattedDate}.\n\nMakani Cosmétique`;
    await this.send(user.email, 'Demande de suppression de compte reçue — Makani Cosmétique', html, text);
  }


  async sendNewsletterDoubleOptIn(to: string, confirmUrl: string): Promise<void> {
    const html = `
      <p>Bonjour,</p>
      <p>Pour finaliser votre inscription à la newsletter Makani Cosmétique et recevoir <strong>5% de réduction</strong> sur votre première commande, confirmez votre adresse email en cliquant sur le lien ci-dessous :</p>
      <p style="text-align:center;margin:1.5rem 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:0.85rem 1.5rem;background:#C44D3A;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;">Confirmer mon inscription</a>
      </p>
      <p style="font-size:0.85rem;color:#666;">Si le bouton ne fonctionne pas, copiez ce lien : <br/><code style="font-size:0.78rem;">${confirmUrl}</code></p>
      <p style="font-size:0.85rem;color:#888;margin-top:1.5rem;">Si vous n êtes pas à l origine de cette demande, ignorez simplement ce message.</p>
      <p>À bientôt,<br/>L équipe Makani Cosmétique</p>
    `;
    const text = `Confirmez votre inscription à la newsletter Makani Cosmétique et recevez -5% : ${confirmUrl}\n\nSi vous n êtes pas à l origine de cette demande, ignorez ce message.`;
    await this.send(to, 'Confirmez votre inscription — Makani Cosmétique', html, text);
  }

  async sendNewsletterWelcome(
    to: string,
    params: { promoCode: string; percent: number; validUntil: Date; unsubscribeUrl: string },
  ): Promise<void> {
    const validUntilStr = params.validUntil.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `
      <p>Bienvenue dans la communauté Makani Cosmétique&nbsp;!</p>
      <p>Votre code promo <strong>-${params.percent}%</strong> à utiliser dès votre prochaine commande :</p>
      <p style="text-align:center;margin:1.2rem 0;">
        <code style="display:inline-block;padding:0.7rem 1.2rem;background:#FBF6EF;border:2px dashed #C44D3A;border-radius:8px;font-size:1.2rem;font-weight:600;color:#C44D3A;letter-spacing:0.04em;">${params.promoCode}</code>
      </p>
      <p style="font-size:0.85rem;color:#666;">Valable jusqu au <strong>${validUntilStr}</strong>, à usage unique. Saisissez-le à l étape paiement.</p>
      <p>À très vite,<br/>L équipe Makani Cosmétique</p>
      <hr style="margin-top:2rem;border:none;border-top:1px solid #f0ebe4;" />
      <p style="font-size:0.75rem;color:#888;text-align:center;">
        Vous recevez cet email car vous vous êtes inscrit·e à la newsletter Makani Cosmétique.<br/>
        <a href="${params.unsubscribeUrl}" style="color:#888;">Se désinscrire</a>
      </p>
    `;
    const text = `Bienvenue ! Votre code -${params.percent}% : ${params.promoCode} (valable jusqu au ${validUntilStr}).\n\nSe désinscrire : ${params.unsubscribeUrl}`;
    await this.send(to, `Bienvenue ! Votre -${params.percent}% est arrivé`, html, text);
  }

  async sendAccountDeletionExecuted(user: { email: string; fullName: string }): Promise<void> {
    const html = `
      <p>Bonjour ${user.fullName},</p>
      <p>Conformément à votre demande, votre compte a été <strong>anonymisé</strong> ce jour. Vos données personnelles ont été supprimées de nos systèmes (à l exception de l historique de commandes que nous conservons 10 ans pour obligation comptable).</p>
      <p>Nous vous remercions de la confiance que vous nous avez accordée et restons à votre disposition si vous souhaitez recréer un compte ultérieurement.</p>
      <p>Cordialement,<br/>L équipe Makani Cosmétique</p>
    `;
    const text = `Bonjour ${user.fullName},\n\nVotre compte a été anonymisé ce jour. Merci de votre confiance.\n\nMakani Cosmétique`;
    await this.send(user.email, 'Votre compte a été supprimé — Makani Cosmétique', html, text);
  }
}
