import { Navigate, Outlet } from 'react-router-dom';
import type { Perfil } from '../types';
import { useAuth } from './AuthContext';

// Sem login -> /login. Perfil errado -> volta para a tela inicial do próprio perfil.
export default function RotaProtegida({ perfil }: { perfil?: Perfil }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="carregando">Carregando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfil && usuario.perfil !== perfil) return <Navigate to="/" replace />;
  return <Outlet />;
}
