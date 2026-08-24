import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const ReseedContext = createContext<() => void>(() => {});

/** Called by the stale banner's Refresh, once the refetch has landed. */
export const useReseed = () => useContext(ReseedContext);

const Boundary = ({ children }: { children: ReactNode }) => <>{children}</>;

/**
 * Wraps whatever a dialog renders so a stale Refresh can remount it: every input re-seeds from the
 * record that just came back and anything typed against the stale copy is discarded. Remounting is
 * what makes that total — no dialog has to know which of its fields came from the record.
 */
export function ReseedScope({ children }: { children: ReactNode }) {
  const [seed, setSeed] = useState(0);
  const reseed = useCallback(() => setSeed((n) => n + 1), []);
  return (
    <ReseedContext.Provider value={reseed}>
      <Boundary key={seed}>{children}</Boundary>
    </ReseedContext.Provider>
  );
}
