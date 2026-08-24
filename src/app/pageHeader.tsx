import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Tone } from '@/ui/status';

export interface Crumb {
  label: string;
  /** A crumb with a route is a link; the last crumb is never one. */
  to?: string | undefined;
}

export interface PageHeaderModel {
  crumbs: Crumb[];
  title: string;
  description?: string | undefined;
  /** Machine values (a plate number) are set in mono, as in the prototype's `titleMono`. */
  mono?: boolean | undefined;
  badges?: Array<{ label: string; tone: Tone; dot: string }> | undefined;
}

interface Store {
  header: PageHeaderModel | null;
  setHeader: (next: PageHeaderModel | null) => void;
}

const HeaderContext = createContext<Store>({ header: null, setHeader: () => {} });

/**
 * The prototype keeps the breadcrumb, title, badges and description in a sticky bar above the
 * scroll area, so only the page body is a centred max-width column. A screen declares that model
 * here and the shell renders it.
 */
export function PageHeaderProvider({ children }: { children: (header: PageHeaderModel | null) => ReactNode }) {
  const [header, setHeader] = useState<PageHeaderModel | null>(null);
  return (
    <HeaderContext.Provider value={{ header, setHeader }}>
      {children(header)}
    </HeaderContext.Provider>
  );
}

export function usePageHeader(model: PageHeaderModel) {
  const { setHeader } = useContext(HeaderContext);
  const key = JSON.stringify([model.crumbs, model.title, model.description, model.mono, model.badges]);
  useEffect(() => {
    setHeader(model);
    // The serialized model is the dependency: a new object with identical content is not a change.
  }, [key, setHeader]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => setHeader(null), [setHeader]);
}
