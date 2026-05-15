import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';

export function RegisterPage() {
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSession(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-narrow">
      <div className="page-head">
        <h1 className="page-head__title">Create your account</h1>
        <p className="page-head__desc">Start publishing polls in minutes.</p>
      </div>
      <div className="card card--shadow">
        <form className="form-stack" onSubmit={handleSubmit}>
          {error ? <div className="banner banner--error">{error}</div> : null}
          <div className="field">
            <label htmlFor="reg-name">Name</label>
            <input
              id="reg-name"
              type="text"
              className="input"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              minLength={2}
              maxLength={50}
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
            <p className="field__hint">At least 8 characters</p>
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Sign up'}
          </button>
          <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
