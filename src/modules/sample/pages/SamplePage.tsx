import { SampleCard } from '../components/SampleCard';
import { useSamples } from '../hooks/useSamples';

export function SamplePage() {
  const { data, isPending, error, refetch } = useSamples();
  return <><h1>Sample items</h1>
    {isPending && <p role="status">Loading samples…</p>}
    {error && <p role="alert">Could not load samples. Start the API (default port 5001) and ensure <code>/api/samples</code> is proxied. <button onClick={() => void refetch()}>Retry</button></p>}
    {data?.length === 0 && <p>No sample items.</p>}
    {data?.map(item => <SampleCard key={item.id} item={item} />)}
  </>;
}
