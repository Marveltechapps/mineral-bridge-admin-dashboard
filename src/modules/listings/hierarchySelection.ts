export interface DashForm {
  slug: string;
  name: string;
  imageUrl?: string | null;
  imageName?: string | null;
  sourceId?: string | null;
  sourceSheet?: boolean;
  isActive: boolean;
}
export interface DashType {
  slug: string;
  name: string;
  productForms: DashForm[];
}
export interface DashSub {
  slug: string;
  name: string;
  imageUrl?: string | null;
  mineralTypes: DashType[];
}
export interface DashCategory {
  slug: string;
  name: string;
  imageUrl?: string | null;
  subcategories: DashSub[];
}

export interface DashSelection {
  category: string;
  subcategory: string;
  mineralType: string;
  productForm: string;
  query: string;
}

export const emptyDashSelection: DashSelection = {
  category: '',
  subcategory: '',
  mineralType: '',
  productForm: '',
  query: '',
};

export function chooseCategory(current: DashSelection, category: string): DashSelection {
  return { ...current, category, subcategory: '', mineralType: '', productForm: '' };
}

export function chooseSubcategory(current: DashSelection, subcategory: string): DashSelection {
  return { ...current, subcategory, mineralType: '', productForm: '' };
}

export function chooseMineralType(current: DashSelection, mineralType: string): DashSelection {
  return { ...current, mineralType, productForm: '' };
}

export function chooseProductForm(current: DashSelection, productForm: string): DashSelection {
  return { ...current, productForm };
}

export type BrowseStep = 'categories' | 'subcategories' | 'items';

export function browseStep(selection: DashSelection): BrowseStep {
  if (!selection.category) return 'categories';
  if (!selection.subcategory) return 'subcategories';
  return 'items';
}

export function stepBack(selection: DashSelection): DashSelection {
  if (selection.subcategory) {
    return { ...selection, subcategory: '', mineralType: '', productForm: '', query: '' };
  }
  return { ...emptyDashSelection };
}

/** Product forms that belong to the selected subcategory. Other categories are excluded. */
export function formsUnderSubcategory(categories: DashCategory[], categorySlug: string, subcategorySlug: string): DashForm[] {
  const subcategory = categories
    .find((category) => category.slug === categorySlug)
    ?.subcategories.find((sub) => sub.slug === subcategorySlug);
  if (!subcategory) return [];
  return subcategory.mineralTypes.flatMap((type) => type.productForms);
}

export function displayImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const queryAt = url.indexOf('?');
  const path = queryAt === -1 ? url : url.slice(0, queryAt);
  const query = queryAt === -1 ? '' : url.slice(queryAt);
  if (/\.(png|jpe?g|webp|gif|avif)$/i.test(path)) return url;
  return `${path}.png${query}`;
}

export function visibleForms(categories: DashCategory[], selection: DashSelection): DashForm[] {
  const category = categories.find((c) => c.slug === selection.category);
  const subs = category ? category.subcategories : categories.flatMap((c) => c.subcategories);
  const sub = selection.subcategory ? subs.filter((s) => s.slug === selection.subcategory) : subs;
  const types = sub.flatMap((s) => s.mineralTypes);
  const typed = selection.mineralType ? types.filter((t) => t.slug === selection.mineralType) : types;
  const forms = typed.flatMap((t) => t.productForms);
  const narrowed = selection.productForm ? forms.filter((f) => f.slug === selection.productForm) : forms;
  const q = selection.query.trim().toLowerCase();
  if (!q) return narrowed;
  return narrowed.filter((f) => f.name.toLowerCase().includes(q) || (f.sourceId ?? '').toLowerCase().includes(q));
}
