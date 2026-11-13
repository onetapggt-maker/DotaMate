import { useEffect, useState } from 'react';

export function useResource(key, loader) {
  const [state, setState] = useState({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (key == null) return;
    let active = true;
    Promise.resolve().then(loader).then(data => {
      if (active) setState({ key, attempt, data });
    }).catch(error => {
      if (active) setState({ key, attempt, error: error.message });
    });
    return () => { active = false; };
  }, [key, attempt]);
  return {
    ...(state.key === key && state.attempt === attempt ? state : {}),
    retry: () => setAttempt(value => value + 1),
  };
}
