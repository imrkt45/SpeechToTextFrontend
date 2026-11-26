import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import LivePage from './pages/LivePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TranscriptionDetailPage from './pages/TranscriptionDetailPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<LivePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="transcriptions/:id" element={<TranscriptionDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default App;
