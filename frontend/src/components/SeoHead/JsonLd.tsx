import { useEffect } from 'react';

interface Props {
  /** Unique key so the same script tag can be replaced when the data changes. */
  id: string;
  data: Record<string, any>;
}

const JsonLd = ({ id, data }: Props) => {
  useEffect(() => {
    const elementId = `jsonld-${id}`;
    let el = document.getElementById(elementId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = elementId;
      document.head.appendChild(el);
    }
    el.text = JSON.stringify(data);

    return () => {
      const existing = document.getElementById(elementId);
      if (existing) existing.remove();
    };
  }, [id, data]);

  return null;
};

export default JsonLd;
