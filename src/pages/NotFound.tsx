import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-[0.2em]" style={{ color: 'var(--color-text-primary)' }}>404</h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>This route doesn't exist in the crawl graph.</p>
        <a href="/" className="text-xs font-bold tracking-wider underline" style={{ color: 'var(--color-text-primary)' }}>
          Back to Graph
        </a>
      </div>
    </div>
  );
};

export default NotFound;
