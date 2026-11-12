import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { hapticTap, hapticSelection } from '../utils/haptics';

interface DraggableFABProps {
  onClick: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const DraggableFAB: React.FC<DraggableFABProps> = ({
  onClick,
  containerRef,
}) => {
  // Posición del botón flotante en píxeles {x, y}
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    pointerX: 0,
    pointerY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const DRAG_THRESHOLD = 6;
  const MARGIN_X = 16;
  const TOP_SAFE_MARGIN = 148;
  const BOTTOM_SAFE_MARGIN = 86;
  const BUTTON_SIZE = 64;

  useEffect(() => {
    const parent = containerRef?.current || fabRef.current?.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const initialX = rect.width - BUTTON_SIZE - MARGIN_X;
      const initialY = rect.height - BUTTON_SIZE - BOTTOM_SAFE_MARGIN;
      setPosition({ x: Math.max(MARGIN_X, initialX), y: Math.max(TOP_SAFE_MARGIN, initialY) });
    }
  }, [containerRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    const parent = containerRef?.current || fabRef.current?.parentElement;
    if (!parent) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }

    const currentX = position?.x ?? (parent.clientWidth - BUTTON_SIZE - MARGIN_X);
    const currentY = position?.y ?? (parent.clientHeight - BUTTON_SIZE - BOTTOM_SAFE_MARGIN);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      hasMoved: false,
    };

    setIsDragging(true);
    setIsSnapping(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const parent = containerRef?.current || fabRef.current?.parentElement;
    if (!parent) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (!dragStartRef.current.hasMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      dragStartRef.current.hasMoved = true;
      hapticSelection();
    }

    if (dragStartRef.current.hasMoved) {
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      const rawX = dragStartRef.current.initialX + dx;
      const rawY = dragStartRef.current.initialY + dy;

      const clampedX = Math.min(Math.max(8, rawX), parentWidth - BUTTON_SIZE - 8);
      const clampedY = Math.min(
        Math.max(TOP_SAFE_MARGIN, rawY),
        parentHeight - BUTTON_SIZE - 20
      );

      setPosition({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }

    setIsDragging(false);

    if (!dragStartRef.current.hasMoved) {
      hapticTap();
      onClick();
      return;
    }

    const parent = containerRef?.current || fabRef.current?.parentElement;
    if (!parent || !position) return;

    const parentWidth = parent.clientWidth;
    const parentHeight = parent.clientHeight;

    const centerX = position.x + BUTTON_SIZE / 2;
    const snapToLeft = centerX < parentWidth / 2;
    const targetX = snapToLeft ? MARGIN_X : parentWidth - BUTTON_SIZE - MARGIN_X;

    const targetY = Math.min(
      Math.max(TOP_SAFE_MARGIN, position.y),
      parentHeight - BUTTON_SIZE - BOTTOM_SAFE_MARGIN
    );

    setIsSnapping(true);
    setPosition({ x: targetX, y: targetY });
    hapticTap();

    setTimeout(() => {
      setIsSnapping(false);
    }, 280);
  };

  return (
    <button
      ref={fabRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: position
          ? `translate3d(${position.x}px, ${position.y}px, 0)`
          : 'translate3d(calc(100% - 80px), calc(100% - 150px), 0)',
        transition: isSnapping
          ? 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.15)'
          : isDragging
          ? 'none'
          : 'transform 0.15s ease-out',
        touchAction: 'none',
      }}
      className={`absolute top-0 left-0 z-30 w-16 h-16 rounded-full bg-[#16244C] border-[3.5px] border-[#2EC4A4] text-[#2EC4A4] shadow-[0_10px_28px_rgba(13,27,62,0.45)] flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'scale-105 shadow-[0_16px_36px_rgba(13,27,62,0.6)]' : 'animate-fab-pulse'
      }`}
      aria-label="Asistente BancoEstado. Arrastra a cualquier lado de la pantalla o toca para abrir"
      title="Toca para abrir o arrastra con el dedo a un lado"
      type="button"
    >
      {/* Ícono original reconocible de ayuda */}
      <HelpCircle className="w-8 h-8 stroke-[2.4] pointer-events-none" />
    </button>
  );
};
