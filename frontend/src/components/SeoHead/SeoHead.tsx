import { useEffect } from 'react';

interface Props {
  title?: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'product' | 'article';
  canonical?: string;
  noindex?: boolean;
}

const SITE_NAME = 'Makani Cosmétique';
const DEFAULT_TITLE = 'Makani Cosmétique · Beauté Afro · Soins Cheveux, Peau & Parfums';
const DEFAULT_DESC =
  'Makani Cosmétique — votre style, votre beauté. Soins capillaires, soins de la peau et parfums orientaux pour la beauté afro et métissée.';
const SITE_URL = (process.env.REACT_APP_SITE_URL ?? 'https://makani-cosmetique.com').replace(/\/$/, '');

const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const SeoHead = ({ title, description, image, type = 'website', canonical, noindex }: Props) => {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
    document.title = fullTitle;

    const desc = description ?? DEFAULT_DESC;
    const pageUrl = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${SITE_URL}${canonical}`
      : typeof window !== 'undefined'
        ? `${SITE_URL}${window.location.pathname}`
        : SITE_URL;
    const imgUrl = image
      ? image.startsWith('http')
        ? image
        : `${SITE_URL}${image}`
      : null;

    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', pageUrl);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', 'fr_FR');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);

    if (imgUrl) {
      upsertMeta('property', 'og:image', imgUrl);
      upsertMeta('name', 'twitter:image', imgUrl);
    }

    upsertLink('canonical', pageUrl);
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
  }, [title, description, image, type, canonical, noindex]);

  return null;
};

export default SeoHead;
