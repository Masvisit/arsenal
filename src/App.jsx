import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import Soon from './pages/Soon.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/biblioteca" element={<Soon title="Biblioteca" />} />
        <Route path="/historial" element={<Soon title="Historial" />} />
        <Route path="/pla" element={<Soon title="Pla setmanal" />} />
        <Route path="/que-em-falta" element={<Soon title="Què em falta?" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
