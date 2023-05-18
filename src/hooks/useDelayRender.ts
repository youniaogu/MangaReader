import { useState, useEffect } from 'react';

export const useDelayRender = (defaultValue = false, duration = 500) => {
  const [render, setRender] = useState(defaultValue);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRender(true);
    }, duration);
    return () => clearTimeout(timeout);
  }, [duration, setRender]);

  return render;
};
