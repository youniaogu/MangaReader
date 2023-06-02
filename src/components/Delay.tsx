import React, { ReactNode, useEffect } from 'react';
import { useDisclose } from 'native-base';

interface DelayProps {
  children: ReactNode;
  duration?: number;
}

const Delay = ({ children, duration = 300 }: DelayProps) => {
  const { isOpen, onOpen } = useDisclose(false);

  useEffect(() => {
    const timeout = setTimeout(onOpen, duration);
    return () => clearTimeout(timeout);
  }, [duration, onOpen]);

  return <>{isOpen ? children : null}</>;
};

export default Delay;
