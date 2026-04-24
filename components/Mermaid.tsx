
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
      
      // We need to clear the content before rendering again
      ref.current.innerHTML = chart;
      mermaid.init(undefined, ref.current);
    }
  }, [chart]);

  return (
    <div className="mermaid flex justify-center py-4 bg-white rounded-lg overflow-x-auto" ref={ref}>
      {chart}
    </div>
  );
};
