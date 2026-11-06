import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Create from './pages/Create.jsx';
import Wizard from './pages/Wizard.jsx';
import Generating from './pages/Generating.jsx';
import Result from './pages/Result.jsx';
import Equipment from './pages/Equipment.jsx';
import LocationEditor from './pages/LocationEditor.jsx';
import Profile from './pages/Profile.jsx';
import Soon from './pages/Soon.jsx';
import Live from './pages/Live.jsx';
import History, { HistoryDetail } from './pages/History.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<Create />} />
        <Route path="/assistent" element={<Navigate to="/assistent/cos" replace />} />
        <Route path="/assistent/:pas" element={<Wizard />} />
        <Route path="/generant" element={<Generating />} />
        <Route path="/entrenament/:id" element={<Result />} />
        <Route path="/entrenament/:id/fer" element={<Live />} />
        <Route path="/material" element={<Equipment />} />
        <Route path="/material/:llocId" element={<LocationEditor />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/biblioteca" element={<Soon title="Biblioteca" />} />
        <Route path="/historial" element={<History />} />
        <Route path="/historial/:id" element={<HistoryDetail />} />
        <Route path="/pla" element={<Soon title="Pla setmanal" />} />
        <Route path="/que-em-falta" element={<Soon title="Què em falta?" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
