import { describe, expect, it } from 'vitest';
import { browseStep, chooseCategory, chooseSubcategory, emptyDashSelection, formsUnderSubcategory, stepBack, visibleForms, type DashCategory } from '@/modules/listings/hierarchySelection';

const categories: DashCategory[] = [
  {
    slug: 'precious-metal',
    name: 'Precious Metal',
    subcategories: [
      {
        slug: 'precious-metal-gold',
        name: 'Gold',
        mineralTypes: [
          {
            slug: 'precious-metal-gold',
            name: 'Gold',
            productForms: [
              { slug: 'bullion', name: 'Gold Bullion Bars', sourceId: 'MIN0120', isActive: true },
              { slug: 'dust', name: 'Gold Dust', sourceId: 'MIN0125', isActive: true },
            ],
          },
        ],
      },
    ],
  },
  { slug: 'gemstone', name: 'Gemstone', subcategories: [] },
];

describe('dashboard hierarchy selection', () => {
  it('does not keep a gold form selected after switching category', () => {
    const selected = { ...emptyDashSelection, category: 'precious-metal', subcategory: 'precious-metal-gold', mineralType: 'precious-metal-gold', productForm: 'bullion' };
    expect(visibleForms(categories, selected).map((f) => f.name)).toEqual(['Gold Bullion Bars']);
    const next = chooseCategory(selected, 'gemstone');
    expect(next.productForm).toBe('');
    expect(visibleForms(categories, next)).toEqual([]);
  });

  it('shows categories, then only that category’s forms, and back clears the child', () => {
    expect(browseStep(emptyDashSelection)).toBe('categories');
    const category = chooseCategory(emptyDashSelection, 'precious-metal');
    expect(browseStep(category)).toBe('subcategories');
    const gold = chooseSubcategory(category, 'precious-metal-gold');
    expect(browseStep(gold)).toBe('items');
    expect(formsUnderSubcategory(categories, gold.category, gold.subcategory).map((form) => form.name)).toEqual(['Gold Bullion Bars', 'Gold Dust']);
    expect(formsUnderSubcategory(categories, 'gemstone', 'precious-metal-gold')).toEqual([]);
    const back = stepBack(gold);
    expect(back.subcategory).toBe('');
    expect(back.productForm).toBe('');
    expect(browseStep(back)).toBe('subcategories');
    expect(browseStep(stepBack(back))).toBe('categories');
  });

  it('returns no rows for an empty search miss', () => {
    expect(visibleForms(categories, { ...emptyDashSelection, category: 'precious-metal', query: 'no-such-form' })).toEqual([]);
  });
});
