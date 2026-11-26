import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import FotoItem from '../../components/FotoItem';
import StatusChip from '../../components/StatusChip';
import { ROTULO_CATEGORIA, ROTULO_ESTADO, formatarData } from '../../labels';
import type { Item, Pagina } from '../../types';

const POR_PAGINA = 10;

// O que mostrar para o doador em cada situação (US02).
function Situacao({ item }: { item: Item }) {
  const entrega = (
    <>Entrega: {item.localColeta}, {item.horarioColeta}.{item.instrucoesEntrega ? ` ${item.instrucoesEntrega}` : ''}</>
  );
  switch (item.status) {
    case 'PENDENTE':
      return <>Aguardando a análise do operador.</>;
    case 'APROVADO':
      return <>Pode levar! {entrega}</>;
    case 'ENCAMINHADO':
      return <>Será repassado a {item.parceiroNome ?? 'um parceiro'}. {entrega}</>;
    case 'RECUSADO':
      return <>Motivo: {item.motivoRecusa ?? 'não informado'}.</>;
    case 'RECEBIDO':
      return <>Recebido pela campanha. Obrigado pela doação!</>;
  }
}

export default function MinhasDoacoes() {
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<Pagina<Item> | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (numero: number) => {
    try {
      setErro('');
      setDados(await api<Pagina<Item>>(`/itens?page=${numero}&pageSize=${POR_PAGINA}`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar suas doações.');
    }
  }, []);

  useEffect(() => { void carregar(pagina); }, [carregar, pagina]);

  async function excluir(item: Item) {
    if (!window.confirm(`Excluir "${item.descricao}"?`)) return;
    try {
      await api(`/itens/${item.id}`, { method: 'DELETE' });
      // se era o último da página, volta uma página
      const ultimo = dados?.data.length === 1 && pagina > 1;
      if (ultimo) setPagina(pagina - 1);
      else await carregar(pagina);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Não foi possível excluir.');
      await carregar(pagina);
    }
  }

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.pageSize)) : 1;

  return (
    <>
      <h1>Minhas doações</h1>
      {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
      {!dados && !erro && <p className="carregando">Carregando...</p>}
      {dados && dados.total === 0 && (
        <p className="suave">Você ainda não cadastrou nenhum item. <Link to="/doador/cadastrar">Cadastrar agora</Link></p>
      )}
      <div className="lista">
        {dados?.data.map((item) => (
          <article key={item.id} className="cartao">
            <div className="cartao-topo">
              <strong>{item.quantidade} · {item.descricao}</strong>
              <StatusChip status={item.status} />
            </div>
            <p className="suave">
              {ROTULO_CATEGORIA[item.categoria]} · {ROTULO_ESTADO[item.estadoConservacao]}
              {item.dataValidade ? ` · validade ${formatarData(item.dataValidade)}` : ''} · {item.campanhaNome}
            </p>
            {item.temFoto && <FotoItem itemId={item.id} />}
            <p className="nota"><Situacao item={item} /></p>
            {item.status === 'PENDENTE' && (
              <button type="button" className="btn btn-perigo" onClick={() => excluir(item)}>Excluir</button>
            )}
          </article>
        ))}
      </div>
      {dados && totalPaginas > 1 && (
        <div className="paginacao">
          <button type="button" className="btn" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button type="button" className="btn" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </div>
      )}
    </>
  );
}
