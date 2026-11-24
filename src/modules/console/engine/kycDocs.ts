/** How a KYC capture is drawn in the admin console. A missing file is a label, never a broken image. */

export interface KycDocView {
  kind?: string;
  name?: string;
  url?: string;
  availability?: string;
}

export function kycDocPreview(doc: KycDocView | null | undefined): { img: string; ph: string } {
  if (!doc || doc.availability === 'unavailable') return { img: '', ph: 'unavailable' };
  const url = typeof doc.url === 'string' ? doc.url : '';
  if (url) return { img: url, ph: '' };
  const kind = doc.kind || '';
  const pdf = kind === 'address' || kind === 'business' || kind === 'proof_of_address' || kind === 'business_registration' || /\.pdf$/i.test(doc.name || '');
  return { img: '', ph: pdf ? 'PDF' : 'SCAN' };
}
