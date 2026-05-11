import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useCookieConsent } from "../../context/CookieConsentContext";
import { newsletterService } from "../../services/newsletter";
import styles from "./Footer.module.scss";

const Footer = () => {
  const year = new Date().getFullYear();
  const { openPreferences } = useCookieConsent();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    "idle" | "success" | "already" | "error"
  >("idle");

  const submitNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setFeedback("idle");
    try {
      const result = await newsletterService.subscribe(email.trim(), "footer");
      setFeedback(result.alreadySubscribed ? "already" : "success");
      setEmail("");
    } catch {
      setFeedback("error");
    } finally {
      setSubmitting(false);
    }
  };

  const lockedForm = submitting || feedback === "success" || feedback === "already";

  return (
    <footer className={styles.footer} data-testid="site-footer">
      {/* ── Newsletter masthead ─────────────────────────────────── */}
      <section className={styles.newsletter} aria-labelledby="footer-newsletter-title">
        <div className={styles.newsletterInner}>
          <span className={styles.newsletterMeta} aria-hidden>
            № 04 — Lettre intime
          </span>

          <h2 id="footer-newsletter-title" className={styles.newsletterTitle}>
            Recevez notre <em>lettre</em>
            <br />
            <span className={styles.newsletterTitleAlt}>de saison.</span>
          </h2>

          <p className={styles.newsletterLede}>
            Une lettre par mois — choix d'édit, conseils signés par nos expertes,
            et <strong>−5%</strong> sur votre première commande pour fêter votre
            arrivée.
          </p>

          <form
            className={styles.newsletterForm}
            onSubmit={submitNewsletter}
            data-testid="newsletter-form"
          >
            <label htmlFor="footer-newsletter-email" className={styles.srOnly}>
              Adresse email
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              placeholder="vous@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.newsletterInput}
              data-testid="newsletter-input"
              disabled={lockedForm}
            />
            <button
              type="submit"
              className={styles.newsletterSubmit}
              data-testid="newsletter-submit"
              disabled={lockedForm}
            >
              {submitting ? (
                "Envoi…"
              ) : feedback === "success" ? (
                <>
                  <Check size={16} strokeWidth={2} /> Vérifiez votre boîte
                </>
              ) : feedback === "already" ? (
                <>
                  <Check size={16} strokeWidth={2} /> Déjà inscrit·e
                </>
              ) : (
                <>
                  S'inscrire
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </>
              )}
            </button>
          </form>

          {feedback === "success" && (
            <p className={styles.newsletterFeedback}>
              <Check size={14} strokeWidth={2.2} /> Email de confirmation
              envoyé. Cliquez sur le lien pour valider et recevoir votre code.
            </p>
          )}
          {feedback === "error" && (
            <p className={`${styles.newsletterFeedback} ${styles.newsletterError}`}>
              Une erreur est survenue. Réessayez dans quelques instants.
            </p>
          )}
        </div>
      </section>

      {/* ── Index columns ───────────────────────────────────────── */}
      <section className={styles.index}>
        <div className={styles.indexRow}>
          <div className={styles.indexCol}>
            <Link to="/" className={styles.brand}>
              <span className={styles.brandSerif}>Makani</span>
              <span className={styles.brandItalic}>Cosmétique</span>
            </Link>
            <p className={styles.tagline}>
              Cosmétique pan-africaine éditée à Aubervilliers. Soins, fragrances,
              gestes — pour célébrer la richesse de la beauté afro et métissée.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Instagram" data-testid="social-instagram" className={styles.social}>
                <Instagram size={16} strokeWidth={1.6} />
              </a>
              <a href="#" aria-label="Facebook" data-testid="social-facebook" className={styles.social}>
                <Facebook size={16} strokeWidth={1.6} />
              </a>
              <a href="#" aria-label="Youtube" data-testid="social-youtube" className={styles.social}>
                <Youtube size={16} strokeWidth={1.6} />
              </a>
            </div>
          </div>

          <div className={styles.indexCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colNum}>01</span>
              Boutique
            </h4>
            <ul className={styles.list}>
              <li><Link to="/collections/soins-capillaires">Soins capillaires</Link></li>
              <li><Link to="/collections/soins-de-la-peau">Soins de la peau</Link></li>
              <li><Link to="/collections/parfums-dubai">Parfums d'Orient</Link></li>
              <li><Link to="/collections/huile-pour-cheveux-et-peau">Huiles &amp; beurres</Link></li>
              <li><Link to="/collections/meches-perruques">Mèches &amp; perruques</Link></li>
              <li><Link to="/collections/vetements">Vêtements</Link></li>
              <li><Link to="/brands">Toutes les marques</Link></li>
            </ul>
          </div>

          <div className={styles.indexCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colNum}>02</span>
              Maison
            </h4>
            <ul className={styles.list}>
              <li><Link to="/about">Notre histoire</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/livraison-retours">Livraison &amp; retours</Link></li>
              <li><Link to="/mentions-legales">Mentions légales</Link></li>
              <li><Link to="/cgv">CGV</Link></li>
              <li><Link to="/confidentialite">Confidentialité</Link></li>
              <li><Link to="/sous-traitants">Sous-traitants</Link></li>
              <li>
                <button type="button" onClick={openPreferences} className={styles.linkButton}>
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>

          <div className={styles.indexCol}>
            <h4 className={styles.colTitle}>
              <span className={styles.colNum}>03</span>
              Service
            </h4>
            <ul className={styles.list}>
              <li>
                <a href="mailto:hello@makani-cosmetique.com">
                  <Mail size={14} strokeWidth={1.6} /> hello@makani-cosmetique.com
                </a>
              </li>
              <li>
                <a href="tel:+33766331226">
                  <Phone size={14} strokeWidth={1.6} /> 07 66 33 12 26
                </a>
              </li>
              <li>
                <span>
                  <MapPin size={14} strokeWidth={1.6} /> 142 Rue Henri Barbusse ·
                  93300 Aubervilliers
                </span>
              </li>
            </ul>
            <div className={styles.payments} aria-label="Moyens de paiement acceptés">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Amex</span>
              <span>PayPal</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Massive wordmark ────────────────────────────────────── */}
      <div className={styles.wordmark} aria-hidden>
        MAKANI
      </div>

      {/* ── Bottom strip ────────────────────────────────────────── */}
      <div className={styles.bottom}>
        <p className={styles.bottomLeft}>
          © {year} Makani Cosmétique. Tous droits réservés.
        </p>
        <p className={styles.bottomRight}>
          Édité à <em>Aubervilliers</em> · Cheveux · Peau · Parfum
        </p>
      </div>
    </footer>
  );
};

export default Footer;
