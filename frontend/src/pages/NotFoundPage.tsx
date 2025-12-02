import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-secondary-700 mb-4">Page Not Found</h2>
        <p className="text-secondary-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
