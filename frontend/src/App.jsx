import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { CreatePollPage } from './pages/CreatePollPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { MyPollsPage } from './pages/MyPollsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { PollPage } from './pages/PollPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ResultsPage } from './pages/ResultsPage.jsx';
import { useAuth } from './context/useAuth.js';

function LoginPageGate() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function RegisterPageGate() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <RegisterPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPageGate />} />
        <Route path="register" element={<RegisterPageGate />} />
        <Route element={<ProtectedRoute />}>
          <Route path="polls/new" element={<CreatePollPage />} />
          <Route path="mine" element={<MyPollsPage />} />
        </Route>
        <Route path="polls/:id/results" element={<ResultsPage />} />
        <Route path="polls/:id" element={<PollPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
