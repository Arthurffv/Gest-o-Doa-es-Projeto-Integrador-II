import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import RotaProtegida from './auth/RotaProtegida';
import Layout from './components/Layout';
import Cadastro from './pages/Cadastro';
import CadastrarItem from './pages/doador/CadastrarItem';
import MinhasDoacoes from './pages/doador/MinhasDoacoes';
import Login from './pages/Login';
import Campanhas from './pages/operador/Campanhas';
import Painel from './pages/operador/Painel';
import Parceiros from './pages/operador/Parceiros';

// Leva cada perfil para a sua tela inicial.
function Inicio() {
  const { usuario } = useAuth();
  return <Navigate to={usuario?.perfil === 'OPERADOR' ? '/operador/painel' : '/doador/doacoes'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route element={<RotaProtegida perfil="DOADOR" />}>
            <Route path="/doador/cadastrar" element={<CadastrarItem />} />
            <Route path="/doador/doacoes" element={<MinhasDoacoes />} />
          </Route>
          <Route element={<RotaProtegida perfil="OPERADOR" />}>
            <Route path="/operador/painel" element={<Painel />} />
            <Route path="/operador/campanhas" element={<Campanhas />} />
            <Route path="/operador/parceiros" element={<Parceiros />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
