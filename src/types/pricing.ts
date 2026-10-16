export interface Rate {
  mineral: string;
  grade: string;
  buy: string;
  sell: string;
  source: 'Market feed' | 'Manual override';
  updated: string;
  trend: number;
}

export interface Offer {
  id: string;
  party: string;
  mineral: string;
  weights: string;
  assay: string;
  rate: string;
  suggested: string;
  note: string;
}
