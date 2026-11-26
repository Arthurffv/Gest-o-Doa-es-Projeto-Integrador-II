import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api';
import { ROTULO_TIPO_PARCEIRO } from '../../labels';
import type { Parceiro, TipoParceiro } from '../../types';

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoParceiro>('LABORATORIO_UFOP');
  const [contato, setContato] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setParceiros(await api<Parceiro[]>('/parceiros'));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar os parceiros.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setAviso('');
    try {
      await api('/parceiros', { method: 'POST', body: { nome: nome.trim(), tipo, contato: contato.trim() || undefined } });
      setNome('');
      setContato('');
      setAviso('Parceiro cadastrado.');
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar.');
    }
  }

  return (
    <>
      <h1>Parceiros</h1>
      <form onSubmit={salvar} className="cartao form">
        <h2>Novo parceiro</h2>
        <label className="campo"><span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={120} /></label>
        <label className="campo"><span>Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoParceiro)}>
            {(Object.keys(ROTULO_TIPO_PARCEIRO) as TipoParceiro[]).map((t) => (
              <option key={t} value={t}>{ROTULO_TIPO_PARCEIRO[t]}</option>
            ))}
          </select></label>
        <label className="campo"><span>Contato (opcional)</span>
          <input value={contato} onChange={(e) => setContato(e.target.value)} maxLength={150} /></label>
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        {aviso && <p className="alerta alerta-ok" role="status">{aviso}</p>}
        <button type="submit" className="btn btn-primario">Cadastrar parceiro</button>
      </form>

      <h2>Parceiros cadastrados</h2>
      {carregando && <p className="carregando">Carregando...</p>}
      {!carregando && parceiros.length === 0 && <p className="suave">Nenhum parceiro ainda.</p>}
      <div className="lista">
        {parceiros.map((p) => (
          <article key={p.id} className="cartao">
            <strong>{p.nome}</strong>
            <p className="suave">{ROTULO_TIPO_PARCEIRO[p.tipo]}{p.contato ? ` · ${p.contato}` : ''}</p>
          </article>
        ))}
      </div>
    </>
  );
}
