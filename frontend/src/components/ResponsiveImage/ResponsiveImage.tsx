import { useState } from 'react';
import styles from './ResponsiveImage.module.scss';

interface Props {
  src: string;
  alt: string;
  /** WebP srcset string returned by the backend uploader */
  srcset?: string;
  /** Tiny placeholder data URI for blur-up effect */
  lqip?: string;
  /** Sizes attribute — default "100vw". Override for cards/thumbnails. */
  sizes?: string;
  /** Default lazy. Set to "eager" for above-the-fold hero images. */
  loading?: 'lazy' | 'eager';
  className?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
  /** decoding hint, default "async" */
  decoding?: 'async' | 'sync' | 'auto';
}

const ResponsiveImage = ({
  src,
  alt,
  srcset,
  lqip,
  sizes = '100vw',
  loading = 'lazy',
  className,
  width,
  height,
  onClick,
  decoding = 'async',
}: Props) => {
  const [loaded, setLoaded] = useState(false);

  const showLqip = lqip && !loaded;

  return (
    <span
      className={`${styles.wrap} ${className ?? ''}`}
      onClick={onClick}
      style={{
        backgroundImage: showLqip ? `url(${lqip})` : undefined,
      }}
    >
      <img
        src={src}
        srcSet={srcset}
        sizes={srcset ? sizes : undefined}
        alt={alt}
        loading={loading}
        decoding={decoding}
        width={width}
        height={height}
        className={`${styles.img} ${loaded ? styles.loaded : ''}`}
        onLoad={() => setLoaded(true)}
      />
    </span>
  );
};

export default ResponsiveImage;
