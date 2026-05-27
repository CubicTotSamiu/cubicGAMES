import React, { useRef, useState, useEffect } from 'react';
import { Minus, Square, X, RotateCcw } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface WindowProps {
  key?: React.Key;
  id: string;
  title: string;
  icon: string; // Emoji or Lucide label
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

export default function Window({
  id,
  title,
  icon,
  isOpen,
  isMinimized,
  isMaximized,
  x,
  y,
  width,
  height,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  children
}: WindowProps) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [windowPos, setWindowPos] = useState({ x, y });
  const windowRef = useRef<HTMLDivElement | null>(null);

  // Sync state position with parent position changes
  useEffect(() => {
    setWindowPos({ x, y });
  }, [x, y]);

  // Custom Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Bring window to focus
    onFocus(id);
    
    // Target only the title-bar strip or text (ignore standard maximize buttons click)
    const target = e.target as HTMLElement;
    if (target.closest('.window-control-btn') || target.closest('.no-drag')) {
      return;
    }

    playClickSound();
    
    // Record initial pointer offsets
    setDragStart({
      x: e.clientX - windowPos.x,
      y: e.clientY - windowPos.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStart) return;
    
    // Calculate boundaries matching outer screen constraints
    const nextX = e.clientX - dragStart.x;
    const nextY = Math.max(0, e.clientY - dragStart.y); // Prevent window from dragging off top of screen
    
    setWindowPos({ x: nextX, y: nextY });
    onMove(id, nextX, nextY);
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  // Add global listeners primarily for dragging outside the immediate window titlebar bounds
  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart]);

  if (!isOpen || isMinimized) return null;

  const handleDoubleTitleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.window-control-btn')) return;
    
    playClickSound();
    onMaximize(id);
  };

  const renderIcon = () => {
    if (icon.length <= 2) {
      // It's likely an emoji symbol
      return <span className="mr-1.5 text-sm select-none">{icon}</span>;
    }
    // Simple native letters or Lucide tags
    return <span className="mr-1.5 font-bold select-none text-xs">🗂️</span>;
  };

  // Dimensions classes
  const style: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 40px)', // taskbar heights offset
        zIndex: zIndex,
      }
    : {
        position: 'absolute',
        left: `${windowPos.x}px`,
        top: `${windowPos.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: zIndex,
      };

  return (
    <div
      ref={windowRef}
      style={style}
      className={`text-black flex flex-col select-none rounded-t-[8px] overflow-hidden transition-all duration-75 ${
        zIndex >= 10 ? 'geometric-window' : 'geometric-window-inactive'
      } ${id === 'cubic-paint' ? 'resize-none' : ''}`}
      onClick={() => onFocus(id)}
      id={`xp-window-${id}`}
    >
      {/* Title Bar - Standard XP Gradient layout */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleTitleClick}
        className={`px-2 py-1.5 flex items-center justify-between cursor-move select-none rounded-t-[5px] ${
          zIndex >= 10
            ? 'bg-gradient-to-r from-[#0054e3] via-[#248cfc] to-[#0054e3] text-white font-bold'
            : 'bg-gradient-to-r from-[#7a7a7a] via-[#b5b5b5] to-[#7a7a7a] text-zinc-100 font-medium'
        }`}
        id={`xp-titlebar-${id}`}
      >
        <div className="flex items-center text-xs truncate uppercase tracking-wide select-none">
          {renderIcon()}
          <span className="font-sans select-none geometric-window-title select-none">{title}</span>
        </div>

        {/* Action Window Buttons Group */}
        <div className="flex items-center gap-1 select-none no-drag" id={`xp-actions-${id}`}>
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              onMinimize(id);
            }}
            className="window-control-btn geometric-control-btn geometric-control-btn-min-max text-white font-bold flex items-center justify-center rounded-sm hover:brightness-110 active:scale-95 transition-all text-[8px]"
            title="Minimize"
          >
            <Minus className="w-3 h-3 text-white stroke-[2.5px]" />
          </button>
          
          {/* Maximize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              onMaximize(id);
            }}
            className="window-control-btn geometric-control-btn geometric-control-btn-min-max text-white font-bold flex items-center justify-center rounded-sm hover:brightness-110 active:scale-95 transition-all"
            title={isMaximized ? "Restore Down" : "Maximize"}
          >
            {isMaximized ? (
              <RotateCcw className="w-2.5 h-2.5 text-white stroke-[2px]" />
            ) : (
              <Square className="w-2.5 h-2.5 text-white stroke-[2px]" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              onClose(id);
            }}
            className="window-control-btn geometric-control-btn geometric-control-btn-close text-white font-bold flex items-center justify-center rounded-sm shadow-sm hover:brightness-110 active:scale-95 transition-all"
            title="Close"
          >
            <X className="w-3.5 h-3.5 text-white stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Body Inner content */}
      <div className="flex-1 overflow-auto bg-[#ece9d8] relative no-drag border-t border-zinc-200" id={`xp-window-body-${id}`}>
        {children}
      </div>
    </div>
  );
}
