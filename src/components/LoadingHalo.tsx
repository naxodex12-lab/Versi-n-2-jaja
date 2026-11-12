import React from 'react';

interface LoadingHaloProps {
  isLoading: boolean;
}

export const LoadingHalo: React.FC<LoadingHaloProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div
      className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center transition-opacity duration-200"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Aureola naranja oficial girando */}
        <div className="absolute inset-0 rounded-full border-[3.5px] border-transparent border-t-[#FF6A00] border-r-[#FF6A00] animate-be-spin" />

        {/* Isotipo central oficial */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-xs overflow-hidden">
          <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="6" fill="#D01026" />
            <rect y="36" width="48" height="12" fill="#003E7E" />
            <polygon points="0,31 16,24 16,32 0,37" fill="#F26822" />
            <polygon points="0,21 16,14 16,21 0,28" fill="#F26822" />
            <polygon points="31,6 46,14 46,37 31,37" fill="#F26822" />
            <polygon points="16,14 31,6 31,37 16,37" fill="#FFFFFF" />
            <polygon points="16,14 22,10 31,6 23,17" fill="#FFFFFF" />
          </svg>
        </div>
      </div>
    </div>
  );
};
