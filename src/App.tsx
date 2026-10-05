// ==========================================
// JanDrishti - Router
// ==========================================
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppLayout } from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sentiment from './pages/Sentiment';
import Narratives from './pages/Narratives';
import Network from './pages/Network';
import Geography from './pages/Geography';
import Demographics from './pages/Demographics';
import Coordination from './pages/Coordination';
import { useAuth } from './store/auth.store';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuth(s => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sentiment" element={<Sentiment />} />
        <Route path="/narratives" element={<Narratives />} />
        <Route path="/network" element={<Network />} />
        <Route path="/geography" element={<Geography />} />
        <Route path="/demographics" element={<Demographics />} />
        <Route path="/coordination" element={<Coordination />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </MotionConfig>
);

export default App;
