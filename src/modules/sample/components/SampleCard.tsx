import { Card } from '../../../components/ui/Card';
import type { SampleItem } from '../../../types/sample';

export function SampleCard({ item }: { item: SampleItem }) {
  return <Card><h2>{item.name}</h2><p>{item.description}</p><small>{item.id}</small></Card>;
}
