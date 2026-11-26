import { useEffect, useState } from 'react';
import { apiBlob } from '../api';

// A foto exige login, então é baixada com fetch (com token) e exibida por um endereço temporário.
export default function FotoItem({ itemId }: { itemId: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let endereco: string | null = null;
    let ativo = true;
    apiBlob(`/itens/${itemId}/foto`)
      .then((blob) => {
        if (!ativo) return;
        endereco = URL.createObjectURL(blob);
        setUrl(endereco);
      })
      .catch(() => {});
    return () => {
      ativo = false;
      if (endereco) URL.revokeObjectURL(endereco);
    };
  }, [itemId]);

  if (!url) return null;
  return <img className="foto-item" src={url} alt="Foto do item doado" />;
}
