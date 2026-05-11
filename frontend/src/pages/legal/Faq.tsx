import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import LegalPageLayout, { TocItem } from '../../components/LegalPageLayout/LegalPageLayout';
import SeoHead from '../../components/SeoHead/SeoHead';
import styles from './Faq.module.scss';

const TOC: TocItem[] = [
  { id: 'commande', label: 'Commande' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'retours', label: 'Retours & remboursements' },
  { id: 'compte', label: 'Mon compte' },
  { id: 'produits', label: 'Produits' },
];

interface QA { q: string; a: React.ReactNode; }

const SECTIONS: { id: string; title: string; questions: QA[] }[] = [
  {
    id: 'commande',
    title: 'Commande',
    questions: [
      {
        q: 'Comment passer une commande ?',
        a: (
          <p>
            Sélectionnez vos produits, ajoutez-les au panier, puis suivez les étapes du checkout : choix du mode de
            réception (livraison, point relais ou retrait boutique), saisie de l'adresse, paiement sécurisé. Vous
            recevez un email de confirmation immédiatement après validation du paiement.
          </p>
        ),
      },
      {
        q: 'Puis-je modifier ou annuler ma commande après validation ?',
        a: (
          <p>
            Tant que la commande est en statut « En attente » (paiement en cours) ou « Confirmée », vous pouvez nous
            contacter rapidement à contact@makani-cosmetique.com pour la modifier ou l'annuler. Une fois la commande passée
            en préparation ou expédiée, la modification n'est plus possible — il faudra alors faire une demande de
            retour à réception.
          </p>
        ),
      },
      {
        q: 'Y a-t-il un montant minimum de commande ?',
        a: <p>Non, vous pouvez commander à partir d'un seul produit. Notez toutefois que la livraison gratuite ne s'applique qu'à partir d'un certain montant selon la zone — vous le verrez dans le récapitulatif avant paiement.</p>,
      },
      {
        q: 'Puis-je utiliser un code promo ?',
        a: (
          <p>
            Oui, à l'étape paiement vous pouvez saisir votre code promo dans le champ dédié. Il sera vérifié en temps réel
            (validité, montant minimum, plafond d'utilisation) et appliqué au total. Un seul code promo par commande.
          </p>
        ),
      },
    ],
  },
  {
    id: 'paiement',
    title: 'Paiement',
    questions: [
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: (
          <ul>
            <li>Carte bancaire (Visa, Mastercard, American Express) via Stripe</li>
            <li>Apple Pay et Google Pay (sur les appareils compatibles)</li>
            <li>Compte PayPal</li>
          </ul>
        ),
      },
      {
        q: 'Le paiement est-il sécurisé ?',
        a: (
          <p>
            Absolument. Toutes les transactions sont chiffrées en SSL/TLS et traitées par Stripe et PayPal, certifiés
            PCI-DSS niveau 1. Aucune donnée bancaire complète n'est stockée sur nos serveurs.
          </p>
        ),
      },
      {
        q: 'Que faire si mon paiement a échoué ?',
        a: (
          <p>
            En cas d'échec (carte refusée, fonds insuffisants, problème 3D Secure…), vous voyez un message d'erreur et
            votre commande passe en statut « Paiement échoué ». Cliquez sur <strong>« Réessayer le paiement »</strong>
            depuis la page de confirmation ou le détail de la commande pour tenter un autre moyen de paiement —
            la commande reste réservée pendant 24 heures.
          </p>
        ),
      },
      {
        q: "Je n'ai pas reçu ma facture, que faire ?",
        a: (
          <p>
            La facture est générée automatiquement à la confirmation du paiement et téléchargeable depuis votre espace
            <a href="/account/orders"> Mes commandes</a>, dans la section Paiement de chaque commande payée. Si vous ne
            la trouvez pas, contactez-nous à contact@makani-cosmetique.com en indiquant votre numéro de commande.
          </p>
        ),
      },
    ],
  },
  {
    id: 'livraison',
    title: 'Livraison',
    questions: [
      {
        q: 'Quels sont les délais de livraison ?',
        a: (
          <ul>
            <li>Colissimo (domicile) : 2 à 5 jours ouvrés</li>
            <li>Chronopost Express : 1 jour ouvré</li>
            <li>Mondial Relay (point relais) : 3 à 7 jours ouvrés</li>
            <li>Click & Collect Aubervilliers : 24 à 48h après confirmation</li>
          </ul>
        ),
      },
      {
        q: "Livrez-vous à l'étranger ?",
        a: (
          <p>
            Nous livrons en France métropolitaine, dans l'Union européenne et dans certains pays hors UE. Les zones
            disponibles et leurs tarifs s'affichent automatiquement à l'étape de paiement en fonction de votre adresse.
          </p>
        ),
      },
      {
        q: 'Puis-je suivre mon colis en temps réel ?',
        a: (
          <p>
            Oui, dès l'expédition vous recevez un email avec votre numéro de suivi cliquable. La page de détail de votre
            commande affiche aussi une <strong>timeline de suivi</strong> mise à jour automatiquement (pris en charge,
            en cours d'acheminement, en cours de livraison, livré).
          </p>
        ),
      },
      {
        q: 'Mon colis est en retard, que faire ?',
        a: (
          <p>
            Si votre colis n'est pas arrivé dans le délai annoncé + 2 jours ouvrés, contactez-nous à
            contact@makani-cosmetique.com avec votre numéro de commande. Nous lancerons une enquête auprès du transporteur.
            Au-delà de 7 jours de retard, vous pouvez demander l'annulation de la commande et le remboursement intégral.
          </p>
        ),
      },
    ],
  },
  {
    id: 'retours',
    title: 'Retours & remboursements',
    questions: [
      {
        q: 'Quel est le délai pour retourner un produit ?',
        a: (
          <p>
            Vous disposez de <strong>14 jours</strong> à compter de la réception du colis pour exercer votre droit de
            rétractation, conformément à la loi. La demande se fait directement depuis votre espace
            <a href="/account/orders"> Mes commandes</a>.
          </p>
        ),
      },
      {
        q: 'Quels produits ne peuvent pas être retournés ?',
        a: (
          <p>
            Pour des raisons d'hygiène, les produits cosmétiques <strong>descellés ou ouverts</strong> ne peuvent pas
            être retournés (article L221-28 du Code de la consommation). Cela concerne notamment les parfums ouverts,
            le maquillage utilisé, les soins entamés. Les produits doivent être retournés <strong>dans leur emballage
            d'origine, scellés, non utilisés</strong>.
          </p>
        ),
      },
      {
        q: 'Les frais de retour sont-ils à ma charge ?',
        a: (
          <p>
            Oui, sauf si le produit est défectueux ou non conforme à votre commande, auquel cas nous prenons en charge
            l'intégralité des frais.
          </p>
        ),
      },
      {
        q: 'Quand serai-je remboursé ?',
        a: (
          <p>
            Une fois votre demande de retour approuvée et le produit reçu en bon état, le remboursement est effectué
            sur votre moyen de paiement initial dans un délai de <strong>14 jours maximum</strong>. Selon votre banque,
            le crédit apparaît sur votre relevé sous 5 à 10 jours ouvrés.
          </p>
        ),
      },
    ],
  },
  {
    id: 'compte',
    title: 'Mon compte',
    questions: [
      {
        q: 'Dois-je créer un compte pour commander ?',
        a: <p>Oui, la création d'un compte est nécessaire pour suivre vos commandes, télécharger vos factures et accéder à votre espace personnel. La création est rapide et gratuite.</p>,
      },
      {
        q: "J'ai oublié mon mot de passe",
        a: (
          <p>
            Cliquez sur « Mot de passe oublié ? » sur la page de connexion. Vous recevrez un email avec un lien pour
            définir un nouveau mot de passe (lien valable 1 heure).
          </p>
        ),
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: (
          <p>
            Conformément au RGPD, vous pouvez demander la suppression de votre compte en envoyant un email à
            contact@makani-cosmetique.com. Nous traitons votre demande sous 30 jours maximum. Notez que certaines données
            (factures) sont conservées 10 ans pour des raisons légales.
          </p>
        ),
      },
    ],
  },
  {
    id: 'produits',
    title: 'Produits',
    questions: [
      {
        q: 'Vos produits sont-ils certifiés ?',
        a: (
          <p>
            Tous nos produits cosmétiques respectent la réglementation européenne (Règlement CE n° 1223/2009). La liste
            complète des ingrédients (INCI) est disponible sur chaque fiche produit.
          </p>
        ),
      },
      {
        q: 'Que signifie « Bientôt épuisé » sur une fiche produit ?',
        a: (
          <p>
            Cela signifie que le stock est inférieur au seuil d'alerte (généralement 5 unités). Si le produit vous
            intéresse, mieux vaut le commander rapidement — nous nous efforçons de réapprovisionner régulièrement mais
            certaines références peuvent rester en rupture quelques jours.
          </p>
        ),
      },
      {
        q: 'Vendez-vous des échantillons ?',
        a: <p>Pour le moment, les échantillons sont offerts dans certaines commandes selon les opérations en cours. Suivez-nous sur les réseaux sociaux pour ne pas manquer les annonces.</p>,
      },
    ],
  },
];

const Faq = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <>
    <SeoHead
      title="FAQ — Questions fréquentes"
      description="Toutes les réponses à vos questions sur la commande, le paiement, la livraison, les retours et votre compte Makani Cosmétique."
      canonical="/faq"
    />
    <LegalPageLayout
      title="Questions fréquentes"
      lastUpdated="2026-05-04"
      toc={TOC}
      intro={
        <p>
          Vous ne trouvez pas la réponse à votre question ? Contactez-nous à <strong>contact@makani-cosmetique.com</strong> —
          nous répondons sous 48 heures ouvrées.
        </p>
      }
    >
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          <ul className={styles.list}>
            {section.questions.map((qa, i) => {
              const itemId = `${section.id}-${i}`;
              const open = openId === itemId;
              return (
                <li key={itemId} className={`${styles.item} ${open ? styles.open : ''}`}>
                  <button
                    type="button"
                    className={styles.question}
                    onClick={() => toggle(itemId)}
                    aria-expanded={open}
                  >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span>{qa.q}</span>
                  </button>
                  {open && <div className={styles.answer}>{qa.a}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </LegalPageLayout>
    </>
  );
};

export default Faq;
