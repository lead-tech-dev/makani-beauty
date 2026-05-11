import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import SeoHead from '../../components/SeoHead/SeoHead';
import Spinner from '../../components/Spinner/Spinner';
import { subProcessorsService, SubProcessor } from '../../services/subProcessors';
import styles from './SousTraitants.module.scss';

const SousTraitants = () => {
  const [items, setItems] = useState<SubProcessor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subProcessorsService.listPublic().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <>
      <SeoHead
        title="Liste des sous-traitants"
        description="Liste exhaustive et à jour des prestataires qui traitent des données personnelles pour le compte de Makani Cosmétique (RGPD article 28)."
        canonical="/sous-traitants"
      />

      <div className={styles.page}>
        <nav className={styles.breadcrumb} aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link>
          <ChevronRight size={14} />
          <span>Sous-traitants</span>
        </nav>

        <header className={styles.header}>
          <h1>Liste des sous-traitants</h1>
          <p className={styles.lastUpdated}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <p className={styles.intro}>
            Conformément à l article 28 du RGPD, vous trouverez ci-dessous la liste exhaustive des prestataires qui
            traitent des données personnelles pour le compte de Makani Cosmétique. Tous nos sous-traitants sont liés par
            contrat et offrent les garanties appropriées en matière de protection des données.
          </p>
          <p className={styles.intro}>
            En cas de modification de cette liste, nous vous en informerons par email avec un préavis raisonnable
            avant entrée en vigueur, conformément à nos obligations.
          </p>
        </header>

        {items.length === 0 ? (
          <p className={styles.empty}>Aucun sous-traitant déclaré pour le moment.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sous-traitant</th>
                  <th>Finalité</th>
                  <th>Données transmises</th>
                  <th>Localisation</th>
                  <th>Garanties RGPD</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sp) => (
                  <tr key={sp.id}>
                    <td>
                      <strong>{sp.name}</strong>
                      {sp.website && (
                        <a href={sp.website} target="_blank" rel="noreferrer" className={styles.link}>
                          Politique <ExternalLink size={11} />
                        </a>
                      )}
                    </td>
                    <td>{sp.purpose}</td>
                    <td>{sp.dataTransmitted}</td>
                    <td>{sp.country}</td>
                    <td>{sp.safeguards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.contact}>
          <p>
            Pour toute question relative au traitement de vos données ou pour exercer vos droits RGPD, contactez-nous à{' '}
            <a href="mailto:contact@makani-cosmetique.com">contact@makani-cosmetique.com</a> ou consultez notre{' '}
            <Link to="/confidentialite">Politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </>
  );
};

export default SousTraitants;
