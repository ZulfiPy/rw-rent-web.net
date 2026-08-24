import { usePageHeader, type Crumb, type PageHeaderModel } from '@/app/pageHeader';

/**
 * A screen's header is declared, not rendered: the shell owns the sticky bar that carries the
 * breadcrumb, title, badges and description. A list page has one crumb, which the bar shows with a
 * leading chevron.
 */
export function PageHeader({ title, description, crumbs, badges, mono }: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  badges?: PageHeaderModel['badges'];
  mono?: boolean;
}) {
  usePageHeader({ crumbs: crumbs ?? [{ label: title }], title, description, badges, mono });
  return null;
}
