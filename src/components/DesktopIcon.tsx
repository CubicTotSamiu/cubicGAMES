import React, { useState, useRef, useEffect } from 'react';
import { playClickSound } from '../utils/audio';

interface DesktopIconProps {
  key?: React.Key;
  id: string;
  title: string;
  icon: string; // Emoji, Lucide keyword or dynamic DataURL (like user drawings!)
  type: 'app' | 'folder' | 'file';
  action: string;
  onOpen: (action: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function DesktopIcon({
  id,
  title,
  icon,
  type,
  action,
  onOpen,
  isSelected,
  onSelect
}: DesktopIconProps) {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeout = useRef<number | null>(null);

  // Handle single vs double click / tap for mobile compatibility
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(id);

    setClickCount(prev => prev + 1);

    if (clickCount === 0) {
      // Setup timeout to register double click
      clickTimeout.current = window.setTimeout(() => {
        setClickCount(0);
      }, 350);
    } else {
      // Double click registered!
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      setClickCount(0);
      
      // Play sound and trigger app open
      playClickSound();
      onOpen(action);
    }
  };

  // Safe cleaner
  useEffect(() => {
    return () => {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, [clickCount]);

  const renderVisual = () => {
    // If it's a dynamic data URL from the paint canvas!
    if (icon.startsWith('data:image')) {
      return (
        <div className="w-10 h-10 border border-zinc-400 bg-white p-0.5 rounded shadow-sm overflow-hidden flex items-center justify-center">
          <img src={icon} alt={title} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      );
    }

    if (icon.length <= 2) {
      // It is a standard emoji (e.g. 💻, 🗑️, 🌐)
      return (
        <span className="text-3xl filter hover:scale-105 transition-all select-none">
          {icon}
        </span>
      );
    }

    // Default icon fallback
    return <span className="text-3xl select-none">📁</span>;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`w-[78px] h-[78px] flex flex-col items-center justify-center p-1.5 rounded-[4px] cursor-pointer select-none text-center transition-all ${
        isSelected
          ? 'bg-blue-300/30 border border-blue-500/50 shadow-sm'
          : 'border border-transparent hover:bg-white/10'
      }`}
      id={`desktop-icon-${id}`}
    >
      <div className="flex items-center justify-center h-10 w-10 mb-1" id={`icon-graphics-${id}`}>
        {renderVisual()}
      </div>
      <span 
        className={`text-[10px] sm:text-[11px] leading-tight px-1 font-sans rounded-sm tracking-wide select-none truncate w-full ${
          isSelected 
            ? 'bg-[#0a246a] text-white' 
            : 'text-white text-shadow-md font-medium'
        }`}
        id={`icon-label-${id}`}
      >
        {title}
      </span>
    </div>
  );
}
