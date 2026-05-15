import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';

export function LoginPage() {
  const { login: setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await login({ email: email.trim(), password });
      setSession(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-narrow">
      <div className="page-head">
        <h1 className="page-head__title">Welcome back</h1>
        <p className="page-head__desc">Log in to create polls and track your results.</p>
      </div>
      <div className="card card--shadow">
        <form className="form-stack" onSubmit={handleSubmit}>
          {error ? <div className="banner banner--error">{error}</div> : null}
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
            No account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
