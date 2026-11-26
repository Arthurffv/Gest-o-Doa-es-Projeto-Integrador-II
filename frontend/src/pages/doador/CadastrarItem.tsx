import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, apiUpload } from '../../api';
import { ROTULO_CATEGORIA, ROTULO_ESTADO, formatarData } from '../../labels';
import type { Campanha, Categoria, EstadoConservacao } from '../../types';

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA) as Categoria[];
const ESTADOS = Object.keys(ROTULO_ESTADO) as EstadoConservacao[];
const TAMANHO_MAX = 5 * 1024 * 1024;

export default function CadastrarItem() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [campanhaId, setCampanhaId] = useState<number | ''>('');
  const [categoria, setCategoria] = useState<Categoria>('ROUPAS');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [estado, setEstado] = useState<EstadoConservacao>('BOM');
  const [dataValidade, setDataValidade] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api<Campanha[]>('/campanhas')
      .then((lista) => {
        setCampanhas(lista);
        if (lista.length === 1) setCampanhaId(lista[0].id); // só uma campanha ativa: já vem escolhida
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Não foi possível carregar as campanhas.'))
      .finally(() => setCarregando(false));
  }, []);

  const campanha = campanhas.find((c) => c.id === campanhaId);

  function escolherFoto(arquivo: File | null) {
    setErro('');
    if (arquivo && !['image/jpeg', 'image/png'].includes(arquivo.type)) {
      setFoto(null);
      return setErro('Envie uma foto JPEG ou PNG.');
    }
    if (arquivo && arquivo.size > TAMANHO_MAX) {
      setFoto(null);
      return setErro('A foto deve ter no máximo 5 MB.');
    }
    setFoto(arquivo);
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    const qtd = Number(quantidade);
    if (campanhaId === '') return setErro('Escolha a campanha.');
    if (descricao.trim().length < 2) return setErro('Descreva o item.');
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 9999) return setErro('A quantidade deve ser um número de 1 a 9999.');
    if (categoria === 'ALIMENTOS' && !dataValidade) return setErro('Alimentos exigem a data de validade.');

    setEnviando(true);
    try {
      const criado = await api<{ id: number; mensagem: string }>('/itens', {
        method: 'POST',
        body: {
          campanhaId,
          categoria,
          descricao: descricao.trim(),
          quantidade: qtd,
          estadoConservacao: estado,
          dataValidade: categoria === 'ALIMENTOS' ? dataValidade : undefined,
        },
      });
      let mensagem = criado.mensagem;
      if (foto) {
        try {
          const dados = new FormData();
          dados.append('foto', foto);
          await apiUpload(`/itens/${criado.id}/foto`, dados);
        } catch (errFoto) {
          mensagem += `. Mas a foto não foi anexada: ${errFoto instanceof Error ? errFoto.message : 'erro no envio'}`;
        }
      }
      setSucesso(mensagem);
      setDescricao('');
      setQuantidade('1');
      setDataValidade('');
      setFoto(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o item.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <p className="carregando">Carregando...</p>;
  if (campanhas.length === 0) {
    return (
      <section className="cartao">
        <h1>Cadastrar item</h1>
        <p className="suave">Não há campanha ativa no momento. Volte mais tarde.</p>
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
      </section>
    );
  }

  return (
    <>
      <h1>Cadastrar item</h1>
      <form onSubmit={aoEnviar} className="form">
        <label className="campo">
          <span>Campanha</span>
          <select value={campanhaId} onChange={(e) => setCampanhaId(e.target.value ? Number(e.target.value) : '')} required>
            <option value="">Escolha...</option>
            {campanhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        {campanha && (
          <p className="cartao suave">
            Entrega: {campanha.localColeta} · {campanha.horarioColeta} · até {formatarData(campanha.dataFim)}
          </p>
        )}

        <div role="group" aria-label="Categoria">
          <span className="rotulo">Categoria</span>
          <div className="opcoes">
            {CATEGORIAS.map((c) => (
              <button key={c} type="button" className={`opcao ${categoria === c ? 'marcada' : ''}`} aria-pressed={categoria === c} onClick={() => setCategoria(c)}>
                {ROTULO_CATEGORIA[c]}
              </button>
            ))}
          </div>
        </div>

        <label className="campo">
          <span>Descrição</span>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: camisas masculinas, tamanho M" maxLength={300} required />
        </label>

        <label className="campo campo-curto">
          <span>Quantidade</span>
          <input type="number" inputMode="numeric" min={1} max={9999} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
        </label>

        <div role="group" aria-label="Estado de conservação">
          <span className="rotulo">Estado de conservação</span>
          <div className="opcoes">
            {ESTADOS.map((s) => (
              <button key={s} type="button" className={`opcao ${estado === s ? 'marcada' : ''}`} aria-pressed={estado === s} onClick={() => setEstado(s)}>
                {ROTULO_ESTADO[s]}
              </button>
            ))}
          </div>
        </div>

        {categoria === 'ALIMENTOS' && (
          <label className="campo campo-curto">
            <span>Data de validade</span>
            <input type="date" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} required />
          </label>
        )}

        <label className="campo">
          <span>Foto (opcional, JPEG ou PNG até 5 MB)</span>
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => escolherFoto(e.target.files?.[0] ?? null)} />
        </label>
        {foto && <p className="suave">Foto selecionada: {foto.name}</p>}

        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        {sucesso && (
          <p className="alerta alerta-ok" role="status">
            {sucesso}. <Link to="/doador/doacoes">Ver minhas doações</Link>
          </p>
        )}
        <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar para pré-triagem'}</button>
      </form>
    </>
  );
}
