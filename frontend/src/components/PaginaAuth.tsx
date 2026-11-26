import type { ReactNode } from 'react';
import Logo from './Logo';

// Moldura das telas de login e cadastro.
export default function PaginaAuth({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="auth-fundo">
      <div className="auth-cartao">
        <div className="auth-marca"><span className="auth-logo"><Logo /></span><strong>Triagem Solidária</strong></div>
        <h1>{titulo}</h1>
        {children}
      </div>
    </div>
  );
}
