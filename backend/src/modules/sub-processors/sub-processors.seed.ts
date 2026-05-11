interface Seed {
  name: string;
  purpose: string;
  dataTransmitted: string;
  country: string;
  safeguards: string;
  website?: string;
  displayOrder: number;
}

export const SUB_PROCESSORS_SEED: Seed[] = [
  {
    name: 'Stripe',
    purpose: 'Traitement des paiements par carte bancaire et portefeuilles (Apple Pay, Google Pay)',
    dataTransmitted: 'Email, identité, montant, devise, 4 derniers chiffres CB. Aucune donnée bancaire complète n est stockée par Makani Cosmétique.',
    country: 'États-Unis · Irlande',
    safeguards: 'Clauses contractuelles types (CCT) · EU-US Data Privacy Framework · Certifié PCI-DSS niveau 1',
    website: 'https://stripe.com/fr/privacy',
    displayOrder: 10,
  },
  {
    name: 'PayPal',
    purpose: 'Traitement des paiements par compte PayPal et carte bancaire (ACDC)',
    dataTransmitted: 'Email, identité, adresse, montant, devise',
    country: 'États-Unis · Luxembourg',
    safeguards: 'Clauses contractuelles types (CCT) · EU-US Data Privacy Framework · Certifié PCI-DSS',
    website: 'https://www.paypal.com/fr/legalhub/privacy-full',
    displayOrder: 20,
  },
  {
    name: 'La Poste / Colissimo',
    purpose: 'Livraison à domicile en France',
    dataTransmitted: 'Nom, prénom, adresse de livraison, téléphone, email (notifications de suivi)',
    country: 'France · Union européenne',
    safeguards: 'Service postal universel — RGPD applicable directement',
    website: 'https://www.laposte.fr/donnees-personnelles',
    displayOrder: 30,
  },
  {
    name: 'Mailtrap (sandbox dev) / Resend / SendGrid',
    purpose: 'Envoi des emails transactionnels (confirmation, expédition, retours, notifications)',
    dataTransmitted: 'Email, nom, contenu de l email (numéro de commande, suivi, etc.)',
    country: 'États-Unis · Royaume-Uni · Union européenne (selon prestataire)',
    safeguards: 'Clauses contractuelles types (CCT) · EU-US Data Privacy Framework',
    website: 'https://resend.com/legal/privacy-policy',
    displayOrder: 60,
  },
  {
    name: 'Hébergeur (OVH / AWS / Vercel — à préciser)',
    purpose: 'Hébergement applicatif et base de données',
    dataTransmitted: "L'intégralité des données de la base : profil, commandes, factures, etc.",
    country: 'France ou Union européenne (à confirmer selon hébergeur retenu)',
    safeguards: "Choisir un hébergeur certifié ISO 27001 · serveurs en UE · contrat avec clauses RGPD · chiffrement TLS",
    displayOrder: 70,
  },
  {
    name: 'Google (OAuth + reCAPTCHA si activé)',
    purpose: 'Connexion via compte Google (option), protection anti-spam',
    dataTransmitted: 'Email, nom, photo de profil (au moment de la connexion uniquement)',
    country: 'États-Unis · Irlande',
    safeguards: 'Clauses contractuelles types · EU-US Data Privacy Framework',
    website: 'https://policies.google.com/privacy',
    displayOrder: 80,
  },
];
