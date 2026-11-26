import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import PaginaAuth from '../components/PaginaAuth';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate('/', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PaginaAuth titulo="Entrar">
      <form onSubmit={aoEnviar} className="form">
        <label className="campo">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="campo">
          <span>Senha</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        </label>
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p className="auth-troca">Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
    </PaginaAuth>
  );
}
