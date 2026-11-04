import { useEffect, useState } from 'react';
import { api } from './api';

// Tela inicial só para provar que front e back conversam. Substitua pelas telas (F01 em diante).
export default function App() {
  const [status, setStatus] = useState('verificando...');

  useEffect(() => {
    api<{ status: string }>('/health')
      .then((r) => setStatus(`API respondeu: ${r.status}`))
      .catch((e: Error) => setStatus(`Falha ao falar com a API: ${e.message}`));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Triagem Solidária</h1>
      <p>{status}</p>
    </main>
  );
}
