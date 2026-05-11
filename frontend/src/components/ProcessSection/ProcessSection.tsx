import { ShoppingCart, Package, Truck, Heart } from "lucide-react";
import styles from "./ProcessSection.module.scss";

const steps = [
  {
    icon: ShoppingCart,
    title: "Tu achètes",
    desc: "Paiement sécurisé via les standards e-commerce les plus stricts. Aucune inquiétude — juste la sélection.",
  },
  {
    icon: Package,
    title: "Nous emballons",
    desc: "Notre équipe emballe avec soin et glisse un mot personnalisé pour ajouter une touche de chaleur.",
  },
  {
    icon: Truck,
    title: "Nous expédions",
    desc: "Livraison soignée vers la France, l'Europe et l'international. Suivi à chaque étape.",
  },
  {
    icon: Heart,
    title: "Vous adorez",
    desc: "Recevez votre routine, profitez et devenez la meilleure version de vous. Et n'hésitez pas à partager !",
  },
];

const ProcessSection = () => {
  return (
    <section className={styles.section} data-testid="process-section">
      <div className={styles.head}>
        <span className={styles.eyebrow}>Comment ça marche</span>
        <h2 className={styles.title}>
          De votre commande à votre <em>routine</em>
        </h2>
      </div>
      <ol className={styles.steps}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className={styles.step}
              data-testid={`process-step-${i}`}
            >
              <span className={styles.num}>0{i + 1}</span>
              <span className={styles.icon}>
                <Icon size={26} strokeWidth={1.4} />
              </span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default ProcessSection;
