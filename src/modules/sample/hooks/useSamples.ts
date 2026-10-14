import { useQuery } from '@tanstack/react-query';
import { getSamples } from '../../../services/sample';

export function useSamples() {
  return useQuery({ queryKey: ['samples'], queryFn: ({ signal }) => getSamples(signal), retry: false });
}
