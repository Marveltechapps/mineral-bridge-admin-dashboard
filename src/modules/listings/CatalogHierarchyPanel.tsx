import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import {
  browseStep,
  chooseCategory,
  chooseSubcategory,
  emptyDashSelection,
  formsUnderSubcategory,
  displayImageUrl,
  stepBack,
  type DashCategory,
  type DashSelection,
} from './hierarchySelection';
import styles from './CatalogHierarchy.module.css';

interface HierarchyResponse {
  categories: DashCategory[];
}

function categoryImage(row: DashCategory): string | null {
  return displayImageUrl(row.imageUrl)
    ?? row.subcategories.flatMap((sub) => sub.mineralTypes.flatMap((type) => type.productForms.map((form) => displayImageUrl(form.imageUrl)))).find((url): url is string => Boolean(url))
    ?? null;
}

function subcategoryImage(row: DashCategory['subcategories'][number]): string | null {
  return displayImageUrl(row.imageUrl)
    ?? row.mineralTypes.flatMap((type) => type.productForms.map((form) => displayImageUrl(form.imageUrl))).find((url): url is string => Boolean(url))
    ?? null;
}

export function CatalogHierarchyPanel() {
  const [selection, setSelection] = useState<DashSelection>(emptyDashSelection);
  const query = useQuery({
    queryKey: ['catalog', 'hierarchy'],
    queryFn: ({ signal }) => apiRequest<HierarchyResponse>(ENDPOINTS.catalog.hierarchy, { signal }),
    enabled: !isDemoMode(),
  });
  const categories = query.data?.categories ?? [];
  const step = browseStep(selection);
  const category = categories.find((row) => row.slug === selection.category);
  const subcategories = category?.subcategories ?? [];
  const subcategory = subcategories.find((row) => row.slug === selection.subcategory);
  const q = selection.query.trim().toLowerCase();
  const forms = formsUnderSubcategory(categories, selection.category, selection.subcategory).filter(
    (form) => !q || form.name.toLowerCase().includes(q) || (form.sourceId ?? '').toLowerCase().includes(q),
  );

  return (
    <Card padding="18px 18px 16px">
      {step !== 'categories' && (
        <Button variant="back" icon="arrowLeft" h={32} px={0} fs={13} onClick={() => setSelection(stepBack(selection))}>
          {step === 'items' ? 'Subcategories' : 'Categories'}
        </Button>
      )}
      <Text as="h2" size={16} weight={700}>
        {step === 'categories' ? 'Categories' : step === 'subcategories' ? category?.name || 'Subcategories' : subcategory?.name || 'Product forms'}
      </Text>
      <p className={styles.note}>
        {step === 'categories'
          ? 'Choose a category. Subcategories and product forms stay on the next screens.'
          : step === 'subcategories'
            ? `${subcategories.length} subcategories`
            : `${category?.name ?? 'Category'} · ${forms.length} product forms`}
      </p>
      {isDemoMode() && <p className={styles.note}>Connect the API to load the sheet-backed catalog. No minerals are bundled in this console.</p>}
      {query.isLoading && <p className={styles.note} role="status">Loading catalog…</p>}
      {query.isError && (
        <p className={styles.note} role="alert">
          The hierarchy could not be loaded.{' '}
          <button type="button" className={styles.retry} onClick={() => void query.refetch()}>Retry</button>
        </p>
      )}

      {step === 'items' && (
        <label className={styles.search}>
          Search
          <input
            aria-label="Search product forms"
            value={selection.query}
            placeholder="Name or mineral id"
            onChange={(event) => setSelection({ ...selection, query: event.target.value })}
          />
        </label>
      )}

      {step === 'categories' && categories.length > 0 && (
        <div className={styles.categories}>
          {categories.map((row) => (
            <button key={row.slug} type="button" className={styles.category} onClick={() => setSelection(chooseCategory(selection, row.slug))}>
              {categoryImage(row) ? <img className={styles.productImage} src={categoryImage(row) ?? undefined} alt="" /> : <span className={styles.image} />}
              <strong>{row.name}</strong>
              <small>{row.subcategories.length} subcategories</small>
            </button>
          ))}
        </div>
      )}

      {step === 'subcategories' && (
        <ul className={styles.subs}>
          {subcategories.map((row) => (
            <li key={row.slug}>
              <button type="button" onClick={() => setSelection(chooseSubcategory(selection, row.slug))}>
                {subcategoryImage(row) ? <img className={`${styles.thumb} ${styles.productImage}`} src={subcategoryImage(row) ?? undefined} alt="" /> : <span className={styles.thumb} />}
                <span>
                  <strong>{row.name}</strong>
                  <small>{row.mineralTypes.reduce((count, type) => count + type.productForms.length, 0)} product forms</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === 'items' && (
        <ul className={styles.items}>
          {forms.map((form) => (
            <li key={form.slug}>
              {displayImageUrl(form.imageUrl) ? <img className={`${styles.thumb} ${styles.productImage}`} src={displayImageUrl(form.imageUrl) ?? undefined} alt="" /> : <span className={styles.thumb} />}
              <span>
                <strong>{form.name}</strong>
                <small>{form.sourceId || subcategory?.name}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {!query.isLoading && !query.isError && !isDemoMode() && step === 'categories' && categories.length === 0 && (
        <p className={styles.note}>Nothing is published under this selection.</p>
      )}
      {!query.isLoading && !query.isError && step === 'subcategories' && subcategories.length === 0 && (
        <p className={styles.note}>Nothing is published under this selection.</p>
      )}
      {!query.isLoading && !query.isError && step === 'items' && forms.length === 0 && (
        <p className={styles.note}>No product forms for this subcategory.</p>
      )}
    </Card>
  );
}
