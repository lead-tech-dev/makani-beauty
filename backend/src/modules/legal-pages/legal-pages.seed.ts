interface LegalPageSeed {
  slug: string;
  title: string;
  intro: string | null;
  body: string;
  lastUpdated: string;
}

const TODAY = '2026-05-04';

export const LEGAL_PAGES_SEED: LegalPageSeed[] = [
  {
    slug: 'cgv',
    title: 'Conditions Générales de Vente',
    lastUpdated: TODAY,
    intro:
      'Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits proposés sur le site Makani Cosmétique. Toute commande implique l\'acceptation pleine et entière des CGV en vigueur.',
    body: `## 1. Objet

Les présentes CGV ont pour objet de définir les modalités de vente entre Makani Cosmétique (ci-après « le Vendeur ») et toute personne physique majeure non commerçante (ci-après « le Client ») effectuant un achat sur le site Internet makani-cosmetique.com (ci-après « le Site »).

Le Client reconnaît avoir pris connaissance des présentes CGV avant de passer commande. La validation de la commande vaut acceptation sans restriction ni réserve des présentes CGV.

## 2. Identification du vendeur

Le Site est édité par **[Raison sociale]**, société **[forme juridique]** au capital de **[montant]** €, immatriculée au RCS de **[ville]** sous le numéro **[SIRET]**, dont le siège social est situé **[adresse complète]**.

- Numéro de TVA intracommunautaire : **[FRxxxxxxxxxxx]**
- Email : contact@makani-cosmetique.com
- Téléphone : **[téléphone]**

## 3. Produits

Les produits proposés à la vente sont ceux figurant sur le Site au moment de la consultation par le Client, dans la limite des stocks disponibles. Les photographies illustrant les produits ont une valeur indicative et ne sont pas contractuelles.

Les produits cosmétiques vendus sont conformes à la réglementation française et européenne en vigueur (Règlement CE n° 1223/2009). Les compositions, précautions d\'emploi et mises en garde sont indiquées sur la fiche produit et sur l\'emballage.

## 4. Prix

Les prix sont indiqués en euros, toutes taxes comprises (TTC), hors frais de livraison. Le Vendeur se réserve le droit de modifier ses prix à tout moment, étant entendu que les produits seront facturés sur la base des tarifs en vigueur au moment de la validation de la commande.

Les frais de livraison sont précisés au moment de la commande, en fonction du mode de livraison choisi et de la destination. Le montant total dû figure sur la page de récapitulatif avant validation du paiement.

## 5. Commande

Le Client passe commande en sélectionnant les produits, en validant son panier, en renseignant ses coordonnées et en procédant au paiement. La commande est définitive après validation du paiement.

Un email de confirmation reprenant le récapitulatif de la commande est envoyé au Client. Le Vendeur se réserve le droit d\'annuler ou de refuser toute commande émanant d\'un Client avec lequel un litige existerait, ou en cas de fraude avérée.

## 6. Paiement

Le règlement des achats s\'effectue exclusivement en ligne par carte bancaire (CB, Visa, Mastercard, American Express) via Stripe, ou par compte PayPal. Les transactions sont sécurisées par cryptage SSL.

Le Vendeur ne stocke à aucun moment les données bancaires complètes du Client. Le débit a lieu au moment de la confirmation du paiement par le prestataire de service de paiement.

## 7. Livraison

Les produits sont livrés à l\'adresse indiquée par le Client lors de la commande, ou retirés en boutique selon le mode de réception choisi. Les délais indicatifs sont les suivants :

- Livraison standard (Colissimo) : 2 à 5 jours ouvrés
- Livraison Express (Chronopost) : 1 jour ouvré
- Point relais (Mondial Relay) : 3 à 7 jours ouvrés
- Retrait en boutique : généralement sous 24 à 48 heures après confirmation de la commande

Les frais de livraison sont à la charge du Client et sont indiqués au moment de la commande. La livraison gratuite peut s\'appliquer à partir d\'un certain montant d\'achat selon la zone de livraison.

En cas de retard de livraison de plus de 7 jours par rapport au délai annoncé, le Client peut, après mise en demeure restée infructueuse, annuler sa commande. Les sommes versées seront remboursées dans un délai de 14 jours à compter de la résiliation.

## 8. Droit de rétractation

Conformément à l\'article L221-18 du Code de la consommation, le Client dispose d\'un délai de **14 jours** à compter de la réception du produit pour exercer son droit de rétractation, sans avoir à justifier de motif ni à payer de pénalités.

La demande de retour s\'effectue depuis l\'espace « Mes commandes » du Site. Les produits doivent être retournés dans leur emballage d\'origine, en parfait état, non utilisés et accompagnés de tous leurs accessoires éventuels.

**Exceptions au droit de rétractation** : conformément à l\'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les produits scellés ne pouvant être renvoyés pour des raisons d\'hygiène ou de protection de la santé, et qui ont été descellés par le Client après la livraison (ex : maquillage, parfums ouverts).

Le remboursement intervient dans un délai de 14 jours à compter de la réception du produit retourné, sur le moyen de paiement utilisé pour la commande. Les frais de retour sont à la charge du Client, sauf en cas de produit défectueux ou non conforme.

## 9. Garanties légales

Le Vendeur est tenu des défauts de conformité du bien au contrat (articles L217-4 et suivants du Code de la consommation) et des vices cachés (articles 1641 et suivants du Code civil).

En cas de défaut de conformité, le Client a le choix entre le remplacement ou le remboursement du produit, dans les conditions prévues par la loi. La garantie légale s\'applique pendant 2 ans à compter de la délivrance du bien.

## 10. Données personnelles

Le traitement des données personnelles du Client est régi par notre [Politique de confidentialité](/confidentialite), conforme au Règlement Général sur la Protection des Données (RGPD).

## 11. Litiges

Les présentes CGV sont soumises au droit français. En cas de litige, le Client s\'engage à contacter en priorité le service client par email à contact@makani-cosmetique.com afin de rechercher une solution amiable.

À défaut d\'accord, le Client peut recourir gratuitement au médiateur de la consommation **[nom du médiateur, ex: CNPM Médiation Consommation]** dans un délai d\'un an à compter de la réclamation écrite. Le Client peut également utiliser la plateforme européenne de règlement en ligne des litiges (RLL) à l\'adresse [ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).

À défaut de résolution amiable, les tribunaux français seront seuls compétents.
`,
  },
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    lastUpdated: TODAY,
    intro:
      'Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l\'économie numérique (LCEN), il est précisé aux utilisateurs du site les informations suivantes.',
    body: `## 1. Éditeur du site

**Raison sociale** : **[Raison sociale, ex: Makani Cosmétique SAS]**
**Forme juridique** : **[ex: Société par Actions Simplifiée]**
**Capital social** : **[montant]** €
**Siège social** : **[adresse complète]**
**RCS** : **[ville]** **[numéro RCS]**
**SIRET** : **[14 chiffres]**
**N° TVA intra** : **[FRxxxxxxxxxxx]**
**Email** : contact@makani-cosmetique.com
**Téléphone** : **[téléphone]**

## 2. Directeur de la publication

**[Nom du directeur de publication]**, en qualité de **[fonction, ex: Président]**.

## 3. Hébergeur

Le site est hébergé par **[Nom de l\'hébergeur, ex: OVH SAS / Vercel Inc. / AWS]**, dont le siège social est situé **[adresse hébergeur]**.

## 4. Propriété intellectuelle

L\'ensemble des éléments du site (textes, photographies, logos, marques, vidéos, illustrations, charte graphique) sont protégés par le droit de la propriété intellectuelle et appartiennent à Makani Cosmétique ou à ses partenaires.

Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle du Site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit est interdite sans l\'autorisation écrite préalable de Makani Cosmétique.

## 5. Liens hypertextes

Le site peut contenir des liens hypertextes vers des sites tiers. Makani Cosmétique n\'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leurs contenus, à leurs offres et à leurs pratiques en matière de protection des données personnelles.

La création de liens vers le site Makani Cosmétique est libre, à condition de ne pas porter atteinte à l\'image, à la réputation ou aux intérêts de Makani Cosmétique.

## 6. Responsabilité

Makani Cosmétique s\'efforce d\'assurer au mieux de ses possibilités l\'exactitude et la mise à jour des informations diffusées sur son site, mais ne peut garantir l\'exactitude, la précision ou l\'exhaustivité des informations mises à disposition.

En conséquence, Makani Cosmétique décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site, ainsi que pour tous les dommages résultant d\'une intrusion frauduleuse d\'un tiers ayant entraîné une modification des informations.

## 7. Médiation de la consommation

Conformément à l\'article L612-1 du Code de la consommation, le Client peut recourir gratuitement au service de médiation **[nom et coordonnées du médiateur, ex: CNPM Médiation Consommation]**.
`,
  },
  {
    slug: 'confidentialite',
    title: 'Politique de confidentialité',
    lastUpdated: TODAY,
    intro:
      'Makani Cosmétique s\'engage à protéger la vie privée et les données personnelles de ses utilisateurs, conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée. La présente politique vous informe de la manière dont vos données sont collectées, utilisées et protégées.',
    body: `## 1. Préambule

En utilisant le site Makani Cosmétique, vous reconnaissez avoir pris connaissance de la présente politique de confidentialité. Cette politique s\'applique à toutes les données collectées dans le cadre de votre navigation, de la création de votre compte client et de vos commandes.

## 2. Responsable du traitement

Le responsable du traitement de vos données personnelles est **[Raison sociale]**, dont les coordonnées figurent dans les [mentions légales](/mentions-legales).

Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous pouvez nous contacter à : **[email DPO ou contact@makani-cosmetique.com]**.

## 3. Données collectées

Nous collectons les catégories de données suivantes :

- **Données d\'identification** : nom, prénom, email, téléphone, date de naissance (si renseignée)
- **Données de connexion** : mot de passe (chiffré), tokens de session
- **Données de commande** : adresses de livraison et facturation, historique des commandes, factures
- **Données de paiement** : aucune donnée bancaire complète n\'est stockée sur nos serveurs ; les transactions transitent par Stripe et PayPal (certifiés PCI-DSS)
- **Données de navigation** : adresse IP, type de navigateur, pages consultées, durée de visite (cookies)
- **Données de communication** : préférences newsletter, échanges avec le service client

## 4. Finalités et base légale

Les données sont collectées pour les finalités suivantes :

| Finalité | Base légale |
| --- | --- |
| Gestion du compte client | Exécution du contrat |
| Traitement et expédition des commandes | Exécution du contrat |
| Facturation et obligations comptables | Obligation légale |
| Service après-vente, retours, remboursements | Exécution du contrat |
| Newsletter et offres commerciales | Consentement |
| Mesure d\'audience anonymisée | Intérêt légitime |
| Lutte contre la fraude | Intérêt légitime |

## 5. Durée de conservation

- **Compte client** : durée de la relation commerciale + 3 ans après la dernière activité
- **Données de commande et factures** : 10 ans (obligation comptable et fiscale)
- **Données de navigation** : 13 mois maximum
- **Newsletter** : jusqu\'à désinscription
- **Cookies** : 6 à 13 mois selon le type, ou jusqu\'à révocation du consentement

## 6. Destinataires

Vos données sont destinées au personnel habilité de Makani Cosmétique et, dans la limite du strict nécessaire, à nos sous-traitants :

- **Stripe** et **PayPal** : prestataires de paiement
- **La Poste / Colissimo, Mondial Relay, Chronopost** : transporteurs (nom et adresse de livraison uniquement)
- **Mailtrap / Resend / SendGrid / serveur SMTP propre** : envoi des emails transactionnels
- **OVH / AWS / Vercel** : hébergement

Tous nos sous-traitants sont liés par contrat respectant le RGPD.

## 7. Transferts hors UE

Certains de nos sous-traitants sont situés hors de l\'Union européenne (par exemple Stripe et PayPal aux États-Unis). Ces transferts sont encadrés par les **clauses contractuelles types** de la Commission européenne ou par d\'autres garanties appropriées (Data Privacy Framework).

## 8. Vos droits

Conformément au RGPD, vous disposez des droits suivants :

- **Droit d\'accès** : obtenir copie de vos données
- **Droit de rectification** : corriger des données inexactes
- **Droit à l\'effacement** : suppression du compte (sauf obligations légales de conservation)
- **Droit à la limitation** du traitement
- **Droit à la portabilité** de vos données
- **Droit d\'opposition** au traitement, notamment au marketing direct
- **Droit de retirer votre consentement** à tout moment
- **Droit d\'introduire une réclamation** auprès de la CNIL (cnil.fr)

Pour exercer vos droits, contactez-nous à : **[email DPO ou contact@makani-cosmetique.com]**. Nous répondons dans un délai d\'un mois maximum.

## 9. Cookies

Le site utilise des cookies pour assurer son bon fonctionnement, mesurer l\'audience et améliorer l\'expérience utilisateur. Les cookies non strictement nécessaires sont déposés uniquement avec votre consentement, recueilli via le bandeau de consentement à votre première visite.

Vous pouvez à tout moment modifier vos préférences en cliquant sur le bouton ci-dessous ou sur le lien « Gérer les cookies » en pied de page.

**Catégories de cookies utilisés** :

- **Cookies strictement nécessaires** : indispensables au fonctionnement (panier, session, sécurité). Toujours actifs, dispense de consentement.
- **Cookies de mesure d\'audience** : statistiques de fréquentation anonymisées.
- **Cookies marketing** : ciblage publicitaire — non utilisés à ce jour.

## 10. Sécurité

Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour assurer la sécurité de vos données : chiffrement des mots de passe (bcrypt), connexion HTTPS (TLS), accès restreint aux données par les seuls personnels habilités, sauvegardes régulières.

En cas de violation de données susceptible d\'engendrer un risque pour vos droits et libertés, vous serez notifié sans délai, conformément à l\'article 34 du RGPD.

## 11. Modifications de la politique

La présente politique de confidentialité peut être modifiée à tout moment pour refléter les évolutions réglementaires ou les changements dans nos pratiques. La version applicable est celle en vigueur lors de votre accès au site. La date de dernière mise à jour est indiquée en haut de page.
`,
  },
  {
    slug: 'livraison-retours',
    title: 'Livraison & retours',
    lastUpdated: TODAY,
    intro:
      'Toutes les informations sur nos modes de livraison, leurs délais et tarifs, ainsi que sur la procédure de retour de vos articles.',
    body: `## 1. Modes de livraison disponibles

Nous proposons quatre modes de réception de votre commande, sélectionnables au moment du paiement :

- **Colissimo** — livraison à domicile en France métropolitaine, 2 à 5 jours ouvrés
- **Chronopost Express** — livraison à domicile en 1 jour ouvré (option premium)
- **Mondial Relay** — retrait en point relais, 3 à 7 jours ouvrés
- **Click & Collect** — retrait gratuit en boutique à Aubervilliers sous 24 à 48 heures

## 2. Tarifs et livraison gratuite

Les frais de livraison sont calculés automatiquement au moment du paiement selon le mode choisi, le poids de la commande et la zone géographique. Le détail s\'affiche dans le récapitulatif avant validation.

**Livraison gratuite** disponible à partir d\'un certain montant d\'achat, variable selon la zone (le seuil est indiqué dans le panier).

## 3. Délais de préparation

Toute commande passée avant 14h en jour ouvré est préparée le jour même. Les commandes du week-end et jours fériés sont préparées le jour ouvré suivant.

Vous recevez un email à chaque étape : confirmation de commande, mise en préparation, expédition (avec numéro de suivi).

## 4. Suivi de votre colis

Une fois votre colis expédié, vous recevez un email contenant un **numéro de suivi cliquable** vers le site du transporteur.

La page de détail de votre commande dans **[Mes commandes](/account/orders)** affiche également une **timeline de suivi mise à jour automatiquement** (pris en charge, en cours d\'acheminement, en cours de livraison, livré).

## 5. Absence à la livraison

En cas d\'absence lors du passage du transporteur :

- **Colissimo** : un avis de passage est laissé, le colis est gardé 15 jours en bureau de poste
- **Chronopost** : nouvelle tentative le lendemain ou retrait en point Chronopost
- **Mondial Relay** : le colis reste 14 jours en point relais
- **Click & Collect** : pas de souci, vous passez quand vous voulez aux horaires d\'ouverture

## 6. Droit de rétractation (14 jours)

Conformément à l\'article L221-18 du Code de la consommation, vous disposez de **14 jours** à compter de la réception du colis pour exercer votre droit de rétractation, sans avoir à justifier de motif.

La demande de retour se fait directement depuis votre espace **[Mes commandes](/account/orders)** : sélection des articles à retourner, motif, validation des CGV.

**Conditions de retour** : les produits doivent être retournés dans leur emballage d\'origine, en parfait état, **scellés**, non utilisés.

**Exceptions** : pour des raisons d\'hygiène, les produits cosmétiques **descellés ou ouverts** ne peuvent pas être retournés (article L221-28 du Code de la consommation).

**Frais de retour** : à votre charge, sauf produit défectueux ou non conforme à votre commande.

## 7. Remboursement

Une fois votre demande de retour approuvée et le produit reçu en bon état, le remboursement est effectué sur **votre moyen de paiement initial** dans un délai de **14 jours maximum**.

Selon votre banque, le crédit apparaît sur votre relevé sous 5 à 10 jours ouvrés.

## 8. Service après-vente

En cas de problème (colis endommagé, article manquant, produit défectueux), contactez-nous rapidement à **contact@makani-cosmetique.com** en indiquant votre numéro de commande et en joignant des photos si possible. Nous répondons sous 48 heures ouvrées.
`,
  },
];
