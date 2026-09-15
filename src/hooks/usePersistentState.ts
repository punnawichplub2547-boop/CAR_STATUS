import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`hrskill_${key}`);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`hrskill_${key}`, JSON.stringify(state));
    } catch (e) {
      console.error(`Failed to save hrskill_${key}`, e);
    }
  }, [key, state]);

  return [state, setState];
}
