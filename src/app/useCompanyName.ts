import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { getCompany } from '@/api/companies';
import { useAccess } from '@/permissions/usePermissions';

/**
 * The operating Company, fetched once and shared. Every signed-in persona except the
 * no-permission one holds Company.Read, so the fallback is only ever seen there.
 */
export function useCompanyName(fallback = 'RW-Rent'): string {
  const { can } = useAccess();
  const { data } = useQuery({
    queryKey: qk.company,
    queryFn: getCompany,
    enabled: can('Company.Read'),
    staleTime: 300_000,
  });
  return data?.name ?? fallback;
}
