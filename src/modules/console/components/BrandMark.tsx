import styles from './BrandMark.module.css';

/** The gold "MB" tile. */
export function BrandMark({ size }: { size: 'large' | 'small' }) {
  return <span className={`${styles.mark} ${size === 'large' ? styles.large : styles.small}`}>MB</span>;
}

/** "MINERAL BRIDGE" with the console tag under it. */
export function BrandWords({ size, tag }: { size: 'large' | 'small'; tag: string }) {
  const large = size === 'large';
  return (
    <span className={styles.words}>
      <span className={`${styles.name} ${large ? styles.nameLarge : styles.nameSmall}`}>MINERAL BRIDGE</span>
      <span className={`${styles.tag} ${large ? styles.tagLarge : styles.tagSmall}`}>{tag}</span>
    </span>
  );
}
