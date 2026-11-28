/** How a KYC capture is drawn in the admin console. A missing file is a label, never a broken image. */

export interface KycDocView {
  kind?: string;
  name?: string;
  url?: string;
  availability?: string;
}

export function kycDocPreview(doc: KycDocView | null | undefined): { img: string; ph: string; open?: string } {
  if (!doc || doc.availability === 'unavailable') return { img: '', ph: 'unavailable' };
  const url = typeof doc.url === 'string' ? doc.url : '';
  const kind = doc.kind || '';
  const mime = (doc as { mimeType?: string }).mimeType || '';
  const namedPdf = /\.pdf$/i.test(doc.name || '') || /application\/pdf/i.test(mime);
  const demoPdf = !url && (kind === 'address' || kind === 'business' || kind === 'proof_of_address' || kind === 'business_registration');
  const pdf = namedPdf || demoPdf;
  if (url && pdf) return { img: '', ph: 'PDF', open: url };
  if (url) return { img: url, ph: '', open: url };
  return { img: '', ph: pdf ? 'PDF' : 'SCAN' };
}
