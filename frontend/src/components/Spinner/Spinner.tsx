import styles from './Spinner.module.scss';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const Spinner = ({ size = 'md', fullPage = false }: Props) => (
  <div className={`${styles.wrapper} ${fullPage ? styles.fullPage : ''}`}>
    <span className={`${styles.ring} ${styles[size]}`} aria-label="Chargement…" />
  </div>
);

export default Spinner;
