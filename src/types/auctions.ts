export interface LiveAuction {
  id: string;
  mineral: string;
  lot: string;
  qty: string;
  bid: string;
  bids: number;
  left: string;
  flagged: boolean;
  leader: string;
}

export interface EndedAuction {
  id: string;
  mineral: string;
  final: string;
  reserve: string;
  bids: number;
  outcome: 'Reserve met' | 'Reserve not met';
  tone: 'green' | 'red';
  winner: string;
}
