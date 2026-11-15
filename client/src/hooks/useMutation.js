import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const notify = useToast();
  async function run(operation, message) {
    setBusy(true); setError(null);
    try {
      const value = await operation();
      if (message) notify(message);
      return { ok: true, value };
    } catch (error) { setError(error); return { ok: false }; }
    finally { setBusy(false); }
  }
  return { busy, error, run };
}
