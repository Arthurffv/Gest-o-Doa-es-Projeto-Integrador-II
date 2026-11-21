import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from './Logo';

export default function Layout() {
  const { usuario, sair, excluirConta } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  const links =
    usuario.perfil === 'DOADOR'
      ? [
          { para: '/doador/cadastrar', texto: 'Cadastrar' },
          { para: '/doador/doacoes', texto: 'Minhas doações' },
        ]
      : [
          { para: '/operador/painel', texto: 'Painel' },
          { para: '/operador/campanhas', texto: 'Campanhas' },
          { para: '/operador/parceiros', texto: 'Parceiros' },
        ];

  async function aoExcluirConta() {
    const ok = window.confirm(
      'Excluir sua conta? Seus dados pessoais e fotos serão apagados e isso não pode ser desfeito.',
    );
    if (!ok) return;
    try {
      await excluirConta();
      navigate('/login', { replace: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Não foi possível excluir a conta.');
    }
  }

  return (
    <div className="app">
      <header className="topo">
        <div className="topo-marca"><Logo /><strong>Triagem Solidária</strong></div>
        <div className="topo-usuario">
          <span>{usuario.nome}</span>
          <button type="button" className="btn btn-claro" onClick={() => { sair(); navigate('/login', { replace: true }); }}>
            Sair
          </button>
        </div>
      </header>
      <nav className="menu" aria-label="Principal">
        {links.map((l) => (
          <NavLink key={l.para} to={l.para} className={({ isActive }) => (isActive ? 'ativo' : '')}>
            {l.texto}
          </NavLink>
        ))}
      </nav>
      <main className="conteudo"><Outlet /></main>
      {usuario.perfil === 'DOADOR' && (
        <footer className="rodape">
          <button type="button" className="link" onClick={aoExcluirConta}>Excluir minha conta</button>
        </footer>
      )}
    </div>
  );
}
