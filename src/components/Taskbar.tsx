import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Music, Volume1 } from 'lucide-react';
import { AppWindow } from '../types';
import { playClickSound, toggleMute, getMuteState, playBgm, stopBgm } from '../utils/audio';

interface TaskbarProps {
  windows: AppWindow[];
  activeWindowId: string | null;
  onToggleStartMenu: () => void;
  onToggleWindow: (id: string) => void;
  isCrtOn: boolean;
  onToggleCrt: () => void;
}

export default function Taskbar({
  windows,
  activeWindowId,
  onToggleStartMenu,
  onToggleWindow,
  isCrtOn,
  onToggleCrt
}: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(getMuteState());
  const [isMusicOn, setIsMusicOn] = useState(false);

  // Tick the tray clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 12 instead of 0
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      setCurrentTime(`${hours}:${minutesStr} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMuteToggle = () => {
    playClickSound();
    const nextMute = toggleMute();
    setIsAudioMuted(nextMute);
    if (nextMute) {
      setIsMusicOn(false);
    }
  };

  const handleBgmToggle = () => {
    playClickSound();
    if (isAudioMuted) {
      alert('Unmute system sounds first via the Speaker icon to hear chiptunes!');
      return;
    }
    const nextMusic = !isMusicOn;
    setIsMusicOn(nextMusic);
    if (nextMusic) {
      playBgm();
    } else {
      stopBgm();
    }
  };

  return (
    <div 
      className="absolute bottom-0 left-0 w-full flex items-center justify-between select-none z-[999] text-white shadow-lg font-sans geometric-taskbar"
      id="xp-system-taskbar"
    >
      {/* Left Portion: Start menu trigger */}
      <div className="flex items-center gap-1.5 h-full" id="taskbar-left-side">
        <button
          onClick={() => {
            playClickSound();
            onToggleStartMenu();
          }}
          className="geometric-start-btn flex items-center gap-1.5 cursor-pointer select-none hover:brightness-105 active:scale-95 transition-all"
          id="xp-start-button"
        >
          {/* Windows retro circle orb icon */}
          <div className="w-5 h-5 rounded-full bg-[#ff9102]/20 border border-white flex items-center justify-center font-bold text-xs select-none">
            🚩
          </div>
          <span className="font-sans font-extrabold text-white text-md italic select-none tracking-normal">start</span>
        </button>

        {/* Quick launch bars */}
        <div className="hidden sm:flex items-center gap-1 border-r border-[#1e64df] pr-1.5 mr-0.5 h-6 select-none" id="xp-quick-launch">
          <button 
            onClick={() => { playClickSound(); onToggleWindow('internet-explorer'); }}
            className="w-7 h-7 hover:bg-white/10 flex items-center justify-center rounded-sm transition-all"
            title="Internet Explorer"
          >
            <span className="text-md">🌐</span>
          </button>
          <button 
            onClick={() => { playClickSound(); onToggleWindow('cubic-paint'); }}
            className="w-7 h-7 hover:bg-white/10 flex items-center justify-center rounded-sm transition-all"
            title="Cubic Paint Pro"
          >
            <span className="text-md">🎨</span>
          </button>
        </div>
      </div>

      {/* Middle Portion: Active tabs list */}
      <div className="flex-1 overflow-x-auto h-full flex items-center gap-1 px-1 sm:px-2 scrollbar-none" id="taskbar-active-tabs">
        {windows
          .filter(win => win.isOpen)
          .map(win => {
            const isActive = win.id === activeWindowId && !win.isMinimized;
            return (
              <button
                key={win.id}
                onClick={() => {
                  playClickSound();
                  onToggleWindow(win.id);
                }}
                className={`flex items-center gap-1.5 px-3 h-7 max-w-[130px] sm:max-w-[150px] border rounded transition-all select-none text-left cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1b5bd255] to-[#3a8efcaa] border-[#0a246a] text-white shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]'
                    : 'bg-gradient-to-b from-[#3c89ff55] to-[#1e62df33] border-[#3f8cf355] text-sky-100 hover:brightness-105 hover:text-white'
                }`}
                style={{
                  boxShadow: isActive ? 'none' : 'inset 1px 1px 0px rgba(255,255,255,0.2)'
                }}
                id={`task-tab-${win.id}`}
              >
                <span className="text-xs truncate overflow-ellipsis flex items-center select-none font-sans select-none">
                  <span className="mr-1 mt-[-2px]">{win.icon}</span>
                  <span className="text-[10.5px] truncate max-w-[70px] sm:max-w-[90px]">{win.title}</span>
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-orange-400 animate-ping ml-auto" />
                )}
              </button>
            );
          })}
      </div>

      {/* Right Portion: System tray block */}
      <div 
        className="geometric-system-tray gap-2"
        id="xp-system-tray"
      >
        {/* Retro chiptune beats sequencer BGM */}
        <button
          onClick={handleBgmToggle}
          className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors text-white ${
            isMusicOn 
              ? 'bg-emerald-700/60 border border-emerald-500 hover:bg-emerald-600 animate-pulse' 
              : 'hover:bg-white/10'
          }`}
          title={isMusicOn ? "Pause music" : "Play retro BGM track"}
        >
          <Music className={`w-4 h-4 ${isMusicOn ? 'text-green-300' : 'text-zinc-200'}`} />
        </button>

        {/* CRT toggle filter icon */}
        <button
          onClick={() => {
            playClickSound();
            onToggleCrt();
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors text-white ${
            isCrtOn 
              ? 'bg-blue-700/60 border border-blue-500 hover:bg-blue-600' 
              : 'hover:bg-white/10'
          }`}
          title={isCrtOn ? "Turn off CRT curve scanlines effect" : "Turn on Retro CRT scanlines atmospheric filter"}
        >
          {isCrtOn ? (
            <Eye className="w-4 h-4 text-cyan-300" />
          ) : (
            <EyeOff className="w-4 h-4 text-zinc-300" />
          )}
        </button>

        {/* Audio click volume control speaker */}
        <button
          onClick={handleMuteToggle}
          className={`w-7 h-7 flex items-center justify-center rounded-sm transition-all ${
            isAudioMuted ? 'text-red-400 bg-red-950/25' : 'text-zinc-200 hover:bg-white/10'
          }`}
          title={isAudioMuted ? "Unmute sounds" : "Mute retro sound effects"}
          id="tray-mute-speaker"
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Horizontal separation divider */}
        <span className="h-6 w-[1px] bg-[#094aab]/80" />

        {/* Dynamic Digital Tray Clock */}
        <div className="flex flex-col text-right justify-center" id="tray-clock">
          <span className="font-sans text-[10.5px] font-semibold text-white tracking-wide select-none">
            {currentTime || '12:00 PM'}
          </span>
        </div>
      </div>
    </div>
  );
}
