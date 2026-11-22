import type { ReactNode } from 'react';

export default function PetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#bfe3f5' }}>
      {children}
    </div>
  );
}
