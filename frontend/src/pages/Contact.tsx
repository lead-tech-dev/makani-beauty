import { useState } from "react";
import { Mail, Phone, MessageCircle, MapPin, Send } from "lucide-react";
import SeoHead from "../components/SeoHead/SeoHead";
import JsonLd from "../components/SeoHead/JsonLd";
import styles from "./Contact.module.scss";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className={styles.page} data-testid="contact-page">
      <SeoHead
        title="Contact"
        description="Une question sur nos produits, votre commande ou un partenariat ? Contactez l'équipe Makani Cosmétique — réponse sous 48h."
        canonical="/contact"
      />
      <JsonLd
        id="local-business"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          name: 'Makani Cosmétique',
          image: `${process.env.REACT_APP_SITE_URL ?? 'https://makani-cosmetique.com'}/logo512.png`,
          telephone: '+33 7 66 33 12 26',
          email: 'hello@makani-cosmetique.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '142 Rue Henri Barbusse',
            postalCode: '93300',
            addressLocality: 'Aubervilliers',
            addressCountry: 'FR',
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              opens: '00:00',
              closes: '23:59',
            },
          ],
          url: `${process.env.REACT_APP_SITE_URL ?? 'https://makani-cosmetique.com'}/contact`,
        }}
      />
      <header className={styles.header}>
        <span className={styles.eyebrow}>Nous contacter</span>
        <h1 className={styles.title}>
          On <em>discute</em> ?
        </h1>
        <p className={styles.subtitle}>
          Une question, un conseil de routine, un partenariat&nbsp;? Notre
          équipe vous répond rapidement, avec attention.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.formCol}>
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            data-testid="contact-form"
          >
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Nom</span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  data-testid="contact-name-input"
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  data-testid="contact-email-input"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span>Sujet</span>
              <select
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
                data-testid="contact-subject-select"
              >
                <option value="">Choisir un sujet</option>
                <option value="conseil">Conseil produit</option>
                <option value="commande">Suivi de commande</option>
                <option value="retour">Retour / remboursement</option>
                <option value="partenariat">Partenariat / Presse</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea
                rows={6}
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                data-testid="contact-message-input"
              />
            </label>
            <button
              type="submit"
              className={styles.submit}
              data-testid="contact-submit"
            >
              {submitted ? "Message envoyé !" : "Envoyer"}
              <Send size={16} />
            </button>
            {submitted && (
              <span className={styles.success} data-testid="contact-success">
                Merci, nous revenons vers vous très vite.
              </span>
            )}
          </form>
        </div>

        <aside className={styles.sideCol}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Mail size={20} />
            </div>
            <h3>Email</h3>
            <a href="mailto:hello@makani-cosmetique.com">hello@makani-cosmetique.com</a>
            <p>Réponse sous 24h ouvrées</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Phone size={20} />
            </div>
            <h3>Téléphone</h3>
            <a href="tel:+33766331226">07 66 33 12 26</a>
            <p>Ouvert 24h/24 · 7j/7</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <MessageCircle size={20} />
            </div>
            <h3>WhatsApp</h3>
            <a
              href="https://wa.me/33766331226"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discuter avec un conseiller
            </a>
            <p>Réponse rapide en journée</p>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <MapPin size={20} />
            </div>
            <h3>Boutique</h3>
            <a
              href="https://www.google.com/maps/search/?api=1&query=142+Rue+Henri+Barbusse%2C+93300+Aubervilliers"
              target="_blank"
              rel="noopener noreferrer"
            >
              142 Rue Henri Barbusse, 93300 Aubervilliers
            </a>
            <p>Ouvert 24h/24 · 7j/7</p>
          </div>
        </aside>
      </div>

      <section className={styles.mapSection} data-testid="contact-map">
        <div className={styles.mapHeader}>
          <span className={styles.eyebrow}>Notre boutique</span>
          <h2 className={styles.mapTitle}>
            Venez nous rendre <em>visite</em>
          </h2>
          <p>
            142 Rue Henri Barbusse, 93300 Aubervilliers · Ouvert 24h/24, 7j/7.
          </p>
        </div>
        <div className={styles.mapWrap}>
          <iframe
            title="Makani Cosmétique - Aubervilliers"
            src="https://www.google.com/maps?q=142+Rue+Henri+Barbusse%2C+93300+Aubervilliers&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
};

export default Contact;
