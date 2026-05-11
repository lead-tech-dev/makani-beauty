import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface BrevoContact {
  id: number;
  email: string;
}

/**
 * Lightweight Brevo (ex-Sendinblue) HTTPS client — fetch only, no SDK dep.
 * If BREVO_API_KEY is not set, the client runs in mock mode (logs only).
 */
@Injectable()
export class BrevoClient {
  private readonly logger = new Logger(BrevoClient.name);
  private readonly apiKey: string | undefined;
  private readonly listId: number | undefined;
  private readonly baseUrl = 'https://api.brevo.com/v3';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('BREVO_API_KEY');
    const listIdRaw = config.get<string>('BREVO_NEWSLETTER_LIST_ID');
    this.listId = listIdRaw ? Number(listIdRaw) : undefined;
  }

  get isMockMode(): boolean {
    return !this.apiKey || !this.listId;
  }

  async upsertContact(email: string, attributes: Record<string, any> = {}): Promise<{ id: string | null; mock: boolean }> {
    if (this.isMockMode) {
      this.logger.log(`[mock] upsertContact ${email} attrs=${JSON.stringify(attributes)}`);
      return { id: null, mock: true };
    }

    const res = await fetch(`${this.baseUrl}/contacts`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        email,
        attributes,
        listIds: [this.listId],
        updateEnabled: true,
      }),
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo upsert failed ${res.status}: ${body}`);
    }
    // Brevo returns the contact id on create, nothing on update — we re-fetch to be sure
    return this.getContact(email);
  }

  async getContact(email: string): Promise<{ id: string | null; mock: boolean }> {
    if (this.isMockMode) return { id: null, mock: true };
    const res = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
      headers: this.headers(),
    });
    if (res.status === 404) return { id: null, mock: false };
    if (!res.ok) throw new Error(`Brevo getContact failed ${res.status}`);
    const data = (await res.json()) as BrevoContact;
    return { id: String(data.id), mock: false };
  }

  async removeFromList(email: string): Promise<void> {
    if (this.isMockMode || !this.listId) {
      this.logger.log(`[mock] removeFromList ${email}`);
      return;
    }
    await fetch(`${this.baseUrl}/contacts/lists/${this.listId}/contacts/remove`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ emails: [email] }),
    }).catch((err) => this.logger.warn(`Brevo removeFromList failed: ${err.message}`));
  }

  private headers(): Record<string, string> {
    return {
      'api-key': this.apiKey ?? '',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
}
