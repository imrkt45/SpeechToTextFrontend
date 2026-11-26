import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="page">
    <div className="empty-state card">
      <h3>Page not found</h3>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="button button-primary">
        Go home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
