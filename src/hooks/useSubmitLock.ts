import { useCallback, useRef, useState } from "react";

/**
 * Prevents double-submit / rapid clicks: runs at most one in-flight async action.
 * Returns `pending` for UI (disabled + "Saving…") and `runExclusive` to wrap the API work.
 */
export function useSubmitLock() {
  const lockedRef = useRef(false);
  const [pending, setPending] = useState(false);

  const runExclusive = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined;
    lockedRef.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      lockedRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, runExclusive };
}
