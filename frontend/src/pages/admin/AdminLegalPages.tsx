import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Edit2 } from 'lucide-react';
import { legalPagesService, LegalPage } from '../../services/legalPages';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';
import styles from './AdminLegalPages.module.scss';

const AdminLegalPages = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    legalPagesService.list().then(setPages).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  return (
    <div>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Pages légales</h1>
          <p className={shared.sub}>
            {pages.length} page{pages.length !== 1 ? 's' : ''} éditables au format markdown
          </p>
        </div>
      </header>

      <ul className={styles.list}>
        {pages.map((page) => {
          const sections = (page.body.match(/^##\s+/gm) ?? []).length;
          return (
            <li key={page.id}>
              <Link to={`/admin/legal-pages/${page.slug}`} className={styles.card}>
                <div className={styles.icon}><FileText size={22} /></div>
                <div className={styles.body}>
                  <strong>{page.title}</strong>
                  <span className={styles.slug}>/{page.slug}</span>
                  <span className={styles.meta}>
                    {sections} section{sections !== 1 ? 's' : ''} · Mise à jour le{' '}
                    {new Date(page.lastUpdated).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <Edit2 size={16} className={styles.editIcon} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdminLegalPages;
