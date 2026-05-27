import React from 'react';
import { LogOut, Power, Compass, Award, FileText, Folder, Radio, Image, HelpCircle } from 'lucide-react';
import { playClickSound, playShutdownSound } from '../utils/audio';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWindow: (windowId: string) => void;
}

export default function StartMenu({ isOpen, onClose, onOpenWindow }: StartMenuProps) {
  if (!isOpen) return null;

  const handleItemClick = (windowId: string) => {
    playClickSound();
    onOpenWindow(windowId);
    onClose();
  };

  const handleTurnOff = () => {
    playClickSound();
    playShutdownSound();
    onClose();
    // Emit custom trigger to shut down the PC screen
    const event = new CustomEvent('xp-shutdown-trigger');
    window.dispatchEvent(event);
  };

  return (
    <div 
      className="absolute bottom-10 left-0 w-[380px] bg-[#d4d0c8] border-2 border-white border-r-[#808080] border-[#808080] shadow-2xl z-[999] rounded-t-md overflow-hidden flex flex-col font-sans select-none animate-slide-up text-black text-xs"
      id="xp-start-menu-panel"
    >
      {/* Header Profile Banner - Classic user account pane */}
      <div 
        className="bg-gradient-to-r from-[#0152da] via-[#2d8eff] to-[#0152da] p-2 flex items-center justify-between border-b-2 border-[#ff9102] rounded-t-sm"
        id="xp-start-header"
      >
        <div className="flex items-center gap-2">
          {/* User Chess/Dinosaur/Orange avatar tile */}
          <div className="w-10 h-10 border-2 border-white bg-slate-900 overflow-hidden flex items-center justify-center rounded-[4px] shadow-sm">
            <span className="text-xl animate-bounce select-none">👾</span>
          </div>
          <div className="flex flex-col text-white">
            <span className="font-bold text-shadow-sm leading-tight text-sm select-none">CubicGamer2004</span>
            <span className="text-[9px] text-sky-200 select-none opacity-85">Online via Cable Modem</span>
          </div>
        </div>
        <div className="flex items-center border border-sky-400 bg-sky-600/20 px-1.5 py-0.5 rounded-sm">
          <span className="text-[8px] text-white tracking-wider font-extrabold uppercase animate-pulse select-none">XP Premium PRO</span>
        </div>
      </div>

      {/* Main Double-Column Layout */}
      <div className="flex flex-row bg-white flex-1" id="start-cols-container">
        
        {/* Left Column (White Background) - Left side launchers */}
        <div className="w-[55%] flex flex-col p-1.5 gap-0.5 bg-white text-zinc-800" id="start-left-col">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2 py-0.5 mb-1 select-none border-b border-zinc-100">
            Programs
          </div>

          <button
            onClick={() => handleItemClick('internet-explorer')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 hover:text-[#0052cd] rounded-sm transition-all flex items-center gap-2"
          >
            <div className="text-lg">🌐</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold">Internet Explorer</span>
              <span className="text-[9px] text-zinc-500">Surf Cubic Games portal</span>
            </div>
          </button>

          <button
            onClick={() => handleItemClick('cubic-blocks')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 hover:text-[#0052cd] rounded-sm transition-all flex items-center gap-2"
          >
            <div className="text-lg">🧱</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold">Cubic Blocks</span>
              <span className="text-[9px] text-zinc-500">Play block falling game</span>
            </div>
          </button>

          <button
            onClick={() => handleItemClick('cubic-paint')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 hover:text-[#0052cd] rounded-sm transition-all flex items-center gap-2"
          >
            <div className="text-lg">🎨</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold">Cubic Paint Pro</span>
              <span className="text-[9px] text-zinc-500">Create retro drawings</span>
            </div>
          </button>

          <button
            onClick={() => handleItemClick('minesweeper')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 hover:text-[#0052cd] rounded-sm transition-all flex items-center gap-2"
          >
            <div className="text-lg">💣</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold">Minesweeper Alpha</span>
              <span className="text-[9px] text-zinc-500">Classic retro mine puzzle</span>
            </div>
          </button>

          <button
            onClick={() => handleItemClick('notepad')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 hover:text-[#0052cd] rounded-sm transition-all flex items-center gap-2"
          >
            <div className="text-lg">📝</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold">Notepad.exe</span>
              <span className="text-[9px] text-zinc-500">Read system retro notes</span>
            </div>
          </button>

          {/* Separation line */}
          <div className="h-[1px] bg-zinc-200 my-1.5" />

          <button
            onClick={() => { playClickSound(); alert('More games coming soon on retro media cd-rom!'); onClose(); }}
            className="w-full text-left px-2.5 py-1 text-[10px] text-blue-700 font-bold hover:underline select-none"
          >
            All Programs ▸
          </button>
        </div>

        {/* Right Column (Light Blue/Grey Panel Background) */}
        <div className="w-[45%] bg-[#ecf2fc] border-l border-[#c4cbd8] flex flex-col p-1.5 gap-1 text-black font-medium" id="start-right-col">
          <button
            onClick={() => handleItemClick('my-computer')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2 font-bold"
          >
            <span className="text-md">📁</span> My Computer
          </button>

          <button
            onClick={() => handleItemClick('my-computer')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2"
          >
            <span className="text-md">📂</span> My Documents
          </button>

          <button
            onClick={() => { playClickSound(); alert('Opening folder "My Pictures". Ensure you save designs inside Cubic Paint Pro to view them in C:\\drive!'); onClose(); }}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2"
          >
            <span className="text-md">🖼️</span> My Pictures
          </button>

          <div className="h-[1px] bg-[#d2d9eb] my-1" />

          <button
            onClick={() => { playClickSound(); alert('No hardware cards detected under DOS layer.'); onClose(); }}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2 text-zinc-500 cursor-not-allowed"
          >
            <span className="text-md opacity-50">🕹️</span> Control Panel
          </button>
          
          <button
            onClick={() => { playClickSound(); alert('Connecting to XP dialup assistance lines: cubic.games help pages.'); onClose(); }}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2"
          >
            <span className="text-md">❓</span> Help & Support
          </button>

          <button
            onClick={() => handleItemClick('run')}
            className="w-full text-left px-2 py-1.5 hover:bg-[#3d95ff]/15 rounded-sm transition-all flex items-center gap-2"
          >
            <span className="text-md">🏃</span> Run...
          </button>
        </div>
      </div>

      {/* Footer Strip - Shutdown buttons */}
      <div 
        className="bg-gradient-to-r from-[#003cb4] via-[#0051e0] to-[#003cb4] p-1.5 flex items-center justify-end gap-3 select-none"
        id="start-footer-bar"
      >
        <button
          onClick={() => { playClickSound(); alert('To Log Off, save all your painting canvas artwork first!'); onClose(); }}
          className="hover:brightness-110 flex items-center gap-1.5 text-white active:scale-95 font-medium px-2 py-1 rounded"
        >
          <LogOut className="w-4 h-4 text-orange-400" />
          <span>Log Off</span>
        </button>

        <button
          onClick={handleTurnOff}
          className="hover:brightness-110 flex items-center gap-1.5 text-white active:scale-95 font-bold px-2 py-1 rounded"
          id="xp-shutdown-btn"
        >
          <Power className="w-4 h-4 text-red-500 fill-red-500" />
          <span>Turn Off Computer</span>
        </button>
      </div>
    </div>
  );
}
