import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LegalPageLayout, { TocItem } from '../../components/LegalPageLayout/LegalPageLayout';
import SeoHead from '../../components/SeoHead/SeoHead';
import Spinner from '../../components/Spinner/Spinner';
import { legalPagesService, LegalPage as LegalPageData } from '../../services/legalPages';
import { useCookieConsent } from '../../context/CookieConsentContext';
import styles from './LegalPage.module.scss';

const slugify = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const buildToc = (body: string): TocItem[] => {
  const lines = body.split('\n');
  const items: TocItem[] = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      const label = m[1].trim();
      const id = slugify(label);
      if (id) items.push({ id, label });
    }
  }
  return items;
};

interface Props {
  slug: 'cgv' | 'mentions-legales' | 'confidentialite' | 'livraison-retours';
}

const LegalPage = ({ slug }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const finalSlug = (params.slug ?? slug) as string;
  const [page, setPage] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { openPreferences, consent } = useCookieConsent();

  useEffect(() => {
    setLoading(true);
    legalPagesService
      .getBySlug(finalSlug)
      .then(setPage)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [finalSlug, navigate]);

  const toc = useMemo(() => (page ? buildToc(page.body) : []), [page]);

  if (loading) return <Spinner fullPage />;
  if (!page) return null;

  return (
    <>
    <SeoHead
      title={page.title}
      description={page.intro?.slice(0, 155) ?? `${page.title} — Makani Cosmétique.`}
      canonical={`/${finalSlug}`}
    />
    <LegalPageLayout
      title={page.title}
      lastUpdated={page.lastUpdated}
      toc={toc}
      intro={page.intro ? <p>{page.intro}</p> : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return <h2 id={id}>{children}</h2>;
          },
          table: ({ children }) => <table className={styles.mdTable}>{children}</table>,
        }}
      >
        {page.body}
      </ReactMarkdown>

      {finalSlug === 'confidentialite' && (
        <div className={styles.cookieAction}>
          <button type="button" className={styles.manageBtn} onClick={openPreferences}>
            Gérer mes préférences cookies
          </button>
          {consent && (
            <span className={styles.status}>
              Vos choix actuels : analytics {consent.analytics ? 'activés' : 'refusés'} · marketing{' '}
              {consent.marketing ? 'activés' : 'refusés'} (mis à jour le{' '}
              {new Date(consent.decidedAt).toLocaleDateString('fr-FR')})
            </span>
          )}
        </div>
      )}
    </LegalPageLayout>
    </>
  );
};

export default LegalPage;
