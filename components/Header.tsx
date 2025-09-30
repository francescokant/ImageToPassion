import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-surface/80 backdrop-blur-lg sticky top-0 z-30 border-b border-border">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          ImageToPassion
        </h1>
      </div>
    </header>
  );
};