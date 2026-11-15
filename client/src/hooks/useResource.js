import { useCallback, useEffect, useState } from 'react';

// Callers use useCallback so effect dependencies reflect the actual request inputs.
export function useResource(loader) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setState({ data: null, loading: true, error: null });
    loader(controller.signal).then(data => { if (current) setState({ data, loading: false, error: null }); })
      .catch(error => { if (current && error.name !== 'AbortError') setState({ data: null, loading: false, error }); });
    return () => { current = false; controller.abort(); };
  }, [loader, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { ...state, reload };
}
