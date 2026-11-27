import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClass =
    size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <span className={`font-extrabold tracking-tight select-none ${sizeClass}`}>
      <span className="text-[#E53935]">MY</span>
      <span className="text-[#202124] dark:text-white">Mita</span>
    </span>
  );
};
