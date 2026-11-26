import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import PaginaAuth from '../components/PaginaAuth';

export default function Cadastro() {
  const { usuario, cadastrar } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [termos, setTermos] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
    if (senha !== confirmar) return setErro('As senhas não conferem.');
    if (!termos) return setErro('É preciso aceitar o aviso de privacidade.');
    setEnviando(true);
    try {
      await cadastrar(nome.trim(), email.trim(), senha);
      navigate('/', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PaginaAuth titulo="Criar conta de doador">
      <form onSubmit={aoEnviar} className="form">
        <label className="campo">
          <span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className="campo">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="campo">
          <span>Senha (mínimo 8 caracteres)</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" required />
        </label>
        <label className="campo">
          <span>Confirmar senha</span>
          <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" required />
        </label>
        <label className="termos">
          <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} />
          <span>
            Li e aceito o aviso de privacidade: usamos só o seu nome e e-mail para organizar a campanha,
            e você pode excluir a conta quando quiser.
          </span>
        </label>
        {erro && <p className="alerta alerta-erro" role="alert">{erro}</p>}
        <button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? 'Criando...' : 'Criar conta'}</button>
      </form>
      <p className="auth-troca">Já tem conta? <Link to="/login">Entrar</Link></p>
    </PaginaAuth>
  );
}
