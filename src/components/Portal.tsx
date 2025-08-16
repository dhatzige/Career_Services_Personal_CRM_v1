import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

const Portal = ({ children }: PortalProps) => {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      // Create portal root if it doesn't exist
      const div = document.createElement('div');
      div.id = 'portal-root';
      document.body.appendChild(div);
      elRef.current = div;
    } else {
      elRef.current = portalRoot as HTMLDivElement;
    }

    return () => {
      // Cleanup if we created the element
      if (elRef.current && elRef.current.id === 'portal-root' && !elRef.current.hasChildNodes()) {
        elRef.current.remove();
      }
    };
  }, []);

  if (!elRef.current) return null;

  return createPortal(children, elRef.current);
};

export default Portal;