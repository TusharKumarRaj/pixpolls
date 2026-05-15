import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="site-root">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="logo">
            pix polls
          </Link>

          {isAuthenticated ? (
            <nav className="nav-pill" aria-label="Main">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-pill__link${isActive ? ' nav-pill__link--active' : ''}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/mine"
                className={({ isActive }) =>
                  `nav-pill__link${isActive ? ' nav-pill__link--active' : ''}`
                }
              >
                Mine
              </NavLink>
              <NavLink
                to="/polls/new"
                className={({ isActive }) =>
                  `nav-pill__link${isActive ? ' nav-pill__link--active' : ''}`
                }
              >
                Create
              </NavLink>
            </nav>
          ) : (
            <div className="site-header__spacer" aria-hidden="true" />
          )}

          <div className="site-header__actions">
            {isAuthenticated ? (
              <>
                <span className="user-chip">{user.name}</span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn--primary btn--sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="shell">
        <Outlet />
      </main>
    </div>
  );
}
