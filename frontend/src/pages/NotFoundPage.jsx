import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-narrow">
      <div className="card card--shadow" style={{ textAlign: 'center' }}>
        <h1 className="page-head__title" style={{ fontSize: '3rem', margin: '0 0 0.5rem' }}>
          404
        </h1>
        <p className="page-head__desc" style={{ marginBottom: '1.5rem' }}>
          This page does not exist.
        </p>
        <Link to="/" className="btn btn--primary">
          Go home
        </Link>
      </div>
    </div>
  );
}
