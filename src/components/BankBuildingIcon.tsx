import React from 'react';

interface BankBuildingIconProps {
  className?: string;
  size?: number;
}

export const BankBuildingIcon: React.FC<BankBuildingIconProps> = ({
  className = 'w-6 h-6',
  size,
}) => {
  return (
    <svg
      className={`${className} shrink-0 select-none`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fondo y techo rojo institucional */}
      <rect width="48" height="48" rx="8" fill="#D01026" />
      {/* Base azul marina BancoEstado */}
      <rect y="36" width="48" height="12" fill="#003E7E" />
      {/* Franjas anaranjadas corporativas laterales */}
      <polygon points="0,31 16,24 16,32 0,37" fill="#F26822" />
      <polygon points="0,21 16,14 16,21 0,28" fill="#F26822" />
      <polygon points="31,6 46,14 46,37 31,37" fill="#F26822" />
      {/* Pilar / Edificio blanco y figura central "1" */}
      <polygon points="16,14 31,6 31,37 16,37" fill="#FFFFFF" />
      <polygon points="16,14 22,10 31,6 23,17" fill="#FFFFFF" />
    </svg>
  );
};
