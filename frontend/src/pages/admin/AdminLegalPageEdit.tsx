import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { legalPagesService, LegalPage } from '../../services/legalPages';
import Spinner from '../../components/Spinner/Spinner';
import shared from './admin.module.scss';
import styles from './AdminLegalPageEdit.module.scss';

const AdminLegalPageEdit = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [body, setBody] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    legalPagesService
      .getBySlug(slug)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
        setIntro(p.intro ?? '');
        setBody(p.body);
        setLastUpdated(p.lastUpdated.slice(0, 10));
      })
      .catch(() => navigate('/admin/legal-pages'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const dirty =
    page !== null &&
    (title !== page.title ||
      intro !== (page.intro ?? '') ||
      body !== page.body ||
      lastUpdated !== page.lastUpdated.slice(0, 10));

  const save = async () => {
    if (!page) return;
    setSaving(true);
    setError('');
    try {
      const updated = await legalPagesService.update(slug, {
        title,
        intro: intro.trim() === '' ? null : intro,
        body,
        lastUpdated,
      });
      setPage(updated);
      setSavedAt(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur à l enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!page) return null;

  return (
    <div className={styles.wrap}>
      <header className={shared.pageHeader}>
        <div>
          <Link to="/admin/legal-pages" className={styles.back}>
            <ArrowLeft size={14} /> Retour aux pages légales
          </Link>
          <h1 className={shared.title}>{page.title}</h1>
          <p className={shared.sub}>
            <code className={styles.code}>/{page.slug}</code> ·{' '}
            <Link to={`/${page.slug}`} target="_blank" rel="noreferrer" className={styles.viewLink}>
              Voir la page publique <ExternalLink size={12} />
            </Link>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? <><EyeOff size={14} /> Masquer aperçu</> : <><Eye size={14} /> Afficher aperçu</>}
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={save}
            disabled={!dirty || saving}
          >
            <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {savedAt && !dirty && (
        <div className={styles.success}>
          Modifications enregistrées à {savedAt.toLocaleTimeString('fr-FR')}.
        </div>
      )}

      <div className={`${styles.editor} ${showPreview ? styles.split : ''}`}>
        <div className={styles.formCol}>
          <label className={styles.field}>
            <span>Titre</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Date de mise à jour</span>
            <input
              type="date"
              value={lastUpdated}
              onChange={(e) => setLastUpdated(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Introduction (optionnel)</span>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="Paragraphe d'intro affiché sous le titre"
            />
          </label>

          <label className={styles.field}>
            <span>
              Contenu (markdown){' '}
              <small className={styles.hint}>
                Les titres <code>## Titre</code> génèrent automatiquement le sommaire.
              </small>
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${styles.textarea} ${styles.body}`}
              rows={28}
              spellCheck
            />
          </label>

          <details className={styles.cheat}>
            <summary>Aide markdown</summary>
            <ul>
              <li><code>## Titre de section</code> — titre niveau 2 (génère le sommaire)</li>
              <li><code>### Sous-titre</code> — sous-titre</li>
              <li><code>**texte**</code> — gras · <code>*texte*</code> — italique</li>
              <li><code>[lien](https://exemple.com)</code> — lien</li>
              <li><code>- item</code> — liste à puces · <code>1. item</code> — liste numérotée</li>
              <li>Tableaux GFM : <code>| col1 | col2 |</code></li>
            </ul>
          </details>
        </div>

        {showPreview && (
          <div className={styles.previewCol}>
            <div className={styles.previewHeader}>Aperçu</div>
            <div className={styles.preview}>
              <h1>{title}</h1>
              <p className={styles.previewDate}>
                Dernière mise à jour : {new Date(lastUpdated).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              {intro && <p className={styles.previewIntro}>{intro}</p>}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLegalPageEdit;
