import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api';
import { formatarData } from '../../labels';
import type { Campanha } from '../../types';

const VAZIO = { nome: '', descricao: '', dataInicio: '', dataFim: '', localColeta: '', horarioColeta: '', instrucoesEntrega: '' };

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setCampanhas(await api<Campanha[]>('/campanhas'));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as campanhas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const mudar = (campo: keyof typeof VAZIO) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  function editar(c: Campanha) {
    setEditandoId(c.id);
    setErro('');
    setAviso('');
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? '',
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      localColeta: c.localColeta,
      horarioColeta: c.horarioColeta,
      instrucoesEntrega: c.instrucoesEntrega ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(VAZIO);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setAviso('');
    if (form.dataFim < form.dataInicio) return setErro('A data final não pode ser anterior à inicial.');
    try {
      if (editandoId) {
        await api(`/campanhas/${editandoId}`, { method: 'PATCH', body: form });
        setAviso('Campanha atualizada.');
      } else {
        await api('/campanhas', { method: 'POST', body: form });
        setAviso('Campanha criada.');
      }
      cancelarEdicao();
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    }
  }

  async function alternarAtiva(c: Campanha) {
    setErro('');
    setAviso('');
    try {
      await api(`/campanhas/${c.id}`, { method: 'PATCH', body: { ativa: !c.ativa } });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível alterar.');
    }
  }

  return (
    <>
      <h1>Campanhas</h1>
      <form onSubmit={salvar} className="cartao form">
        <h2>{editandoId ? 'Editar campanha' : 'Nova campanha'}</h2>
        <label className="campo"><span>Nome</span>
          <input value={form.nome} onChange={mudar('nome')} required minLength={2} maxLength={120} /></label>
        <label className="campo"><span>Descrição (opcional)</span>
          <input value={form.descricao} onChange={mudar('descricao')} maxLength={2000} /></label>
        <div className="linha">
          <label className="campo"><span>Início</span>
            <input type="date" value={form.dataInicio} onChange={mudar('dataInicio')} required /></label>
          <label className="campo"><span>Fim</span>
            <input type="date" value={form.dataFim} onChange={mudar('dataFim')} required /></label>
        </div>
        <label className="campo"><span>Local de entrega</span>
          <input value={form.localColeta} onChange={mudar('localColeta')} required minLength={2} maxLength={255} /></label>
        <label className="campo"><span>Horário de entrega (ex.: Seg–Sex, 14h–18h)</span>
          <input value={form.horarioColeta} onChange={mudar('horarioColeta')} required minLength={2} maxLength={150} /></label>
        <label className="campo"><span>Instruções de entrega (opcional)</span>
          <textarea value={form.instrucoesEntrega} onChange={mudar('instrucoesEntrega')} rows={3} maxLength={2000} /></label>
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        {aviso && <p className="alerta alerta-ok" role="status">{aviso}</p>}
        <div className="linha-botoes">
          <button type="submit" className="btn btn-primario">{editandoId ? 'Salvar alterações' : 'Criar campanha'}</button>
          {editandoId && <button type="button" className="btn" onClick={cancelarEdicao}>Cancelar</button>}
        </div>
      </form>

      <h2>Campanhas cadastradas</h2>
      {carregando && <p className="carregando">Carregando...</p>}
      {!carregando && campanhas.length === 0 && <p className="suave">Nenhuma campanha ainda.</p>}
      <div className="lista">
        {campanhas.map((c) => (
          <article key={c.id} className="cartao">
            <div className="cartao-topo">
              <strong>{c.nome}</strong>
              <span className={`status ${c.ativa ? 'status-aprovado' : 'status-recusado'}`}>{c.ativa ? 'Ativa' : 'Encerrada'}</span>
            </div>
            <p className="suave">{formatarData(c.dataInicio)} a {formatarData(c.dataFim)}</p>
            <p className="suave">Entrega: {c.localColeta} · {c.horarioColeta}</p>
            <div className="linha-botoes">
              <button type="button" className="btn" onClick={() => editar(c)}>Editar</button>
              <button type="button" className="btn" onClick={() => alternarAtiva(c)}>{c.ativa ? 'Encerrar' : 'Reativar'}</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
