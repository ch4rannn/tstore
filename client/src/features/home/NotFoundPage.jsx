import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
      <div className="text-[120px] leading-none mb-4">🛸</div>
      <h1 className="text-4xl font-extrabold text-[var(--color-accent)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        404 - Page Not Found
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
        Oops! It seems you've ventured into uncharted territory. The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary px-8 py-3 text-lg">
        Go Back Home
      </Link>
    </div>
  );
}
