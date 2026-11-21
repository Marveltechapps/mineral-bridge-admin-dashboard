/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared registries for the console engine. The design built these as window.MBA (data + order
// engine) and window.MBV (view-model builders). Each engine module adds to them in load order,
// so later modules can wrap earlier builders exactly as the design does.

/** Seed data, formatters and the order-stage engine. */
export const MBA: any = {};

/** View-model builders: pages, tables, drawers, order detail. */
export const MBV: any = {};

/** SheetJS ES module, loaded on demand when an operator uploads an .xlsx master sheet. */
export const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs';
