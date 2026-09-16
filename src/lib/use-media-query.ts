import { useCallback, useSyncExternalStore } from "react";

/*
 * Client-only facts read without an effect + setState (no cascading render,
 * no hydration mismatch): the server and the hydrating render see `false`,
 * the first client render after hydration the real value.
 */

/** `matchMedia(query).matches`, kept in sync with the query. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

const noop = () => () => {};

/** True once hydrated on the client - false in the server HTML and while hydrating. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}
