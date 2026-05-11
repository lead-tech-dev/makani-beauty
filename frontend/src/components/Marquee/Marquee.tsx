import styles from "./Marquee.module.scss";

const items = [
  "Cheveux afro",
  "Soins naturels",
  "Parfums d'Orient",
  "Beauté métisse",
  "Sélection éditée",
  "Livraison mondiale",
  "Conseils signés",
];

const Marquee = () => {
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className={styles.marquee} data-testid="hero-marquee" aria-hidden>
      <div className={styles.track}>
        {all.map((it, i) => (
          <span key={i} className={styles.itemGroup}>
            <span className={styles.item}>{it}</span>
            <span className={styles.divider}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
