import React from 'react';
import { Play } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface CrtMonitorProps {
  id: string;
  title: string;
  gameId: string; // The action or Window ID to trigger (e.g. 'cubic-blocks', 'minesweeper')
  status: 'active' | 'empty';
  previewColor: string; // Background color gradient for the game preview
  gameSubtitle: string;
  onLaunch: (gameId: string) => void;
}

export default function CrtMonitorView({
  id,
  title,
  gameId,
  status,
  previewColor,
  gameSubtitle,
  onLaunch
}: CrtMonitorProps) {
  
  const handleMonitorClick = () => {
    playClickSound();
    if (status === 'active') {
      onLaunch(gameId);
    }
  };

  return (
    <div 
      className="flex flex-col items-center select-none" 
      id={`crt-monitor-cabinet-${id}`}
    >
      {/* Outer chunky curved CRT Monitor Case */}
      <div 
        onClick={handleMonitorClick}
        className="w-[155px] h-[125px] bg-[#cbc7bd] border-4 border-white border-r-[#8a857a] border-b-[#8a857a] p-2 flex flex-col items-center shadow-lg relative rounded-md cursor-pointer hover:translate-y-[-2px] transition-transform select-none"
        style={{
          boxShadow: '4px 6px 12px rgba(0,0,0,0.35), inset 1.5px 1.5px 0px #fff'
        }}
      >
        {/* Anti-glare screen recessed frame */}
        <div className="w-full flex-1 bg-[#151515] border-2 border-[#5a564c] border-r-[#fcfcfc] border-b-[#fcfcfc] rounded-md relative overflow-hidden flex flex-col p-1">
          {/* Animated Scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[size:100%_3.5px] pointer-events-none z-20" />
          
          {/* CRT Screen Edge shadow Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,0.75))] pointer-events-none z-20" />

          {/* Glowing phosphor background */}
          {status === 'active' ? (
            <div 
              className="w-full h-full flex flex-col justify-between p-1.5 rounded relative text-center items-center overflow-hidden z-10"
              style={{
                background: `linear-gradient(135deg, ${previewColor}, rgba(0,0,0,0.85))`
              }}
            >
              {/* Cathode Ray Tube flickering beam */}
              <div className="absolute inset-0 bg-white/5 animate-pulse mix-blend-overlay pointer-events-none" />

              <div className="mt-1 flex flex-col items-center">
                <span className="font-mono text-[9px] font-extrabold uppercase text-green-300 tracking-wide select-none drop-shadow-md">
                  {title}
                </span>
                <span className="font-sans text-[7.5px] text-zinc-300 tracking-tight font-medium uppercase mt-0.5 select-none opacity-80">
                  {gameSubtitle}
                </span>
              </div>

              {/* Play symbol button on monitor face */}
              <div className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 border border-zinc-600 animate-pulse hover:scale-110 active:scale-90 transition-all shadow-md z-20">
                <Play className="w-3.5 h-3.5 text-green-400 fill-green-400" />
              </div>

              <div className="bg-black/40 border border-green-500/30 px-1.5 py-0.5 rounded-sm z-10">
                <span className="font-mono text-[7px] font-bold text-green-400 animate-pulse tracking-widest uppercase">
                  [ DOUBLE-CLICK ]
                </span>
              </div>
            </div>
          ) : (
            // Empty Monitor Static Screen Loop
            <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center p-2 relative z-10 font-mono">
              {/* Fake Static Noise */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen"
                style={{
                  backgroundImage: `radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(0,0,0,1) 100%)`,
                }}
              />
              <span className="text-zinc-500 text-[9px] uppercase tracking-wider text-center animate-pulse">
                NO SIGNAL
              </span>
              <span className="text-zinc-600 text-[6.5px] uppercase mt-1 tracking-tight">
                COMPATIBLE V1.04
              </span>
            </div>
          )}
        </div>

        {/* Lower Monitor Bezel Trim - power triggers and logo */}
        <div className="w-full h-5 flex items-center justify-between px-1.5 mt-1 select-none text-[8px] text-[#444] font-mono leading-none border-t border-zinc-300">
          {/* Cubic brand script */}
          <span className="font-bold tracking-tight text-[7px] text-zinc-600 uppercase">cubic</span>
          
          {/* Micro knobs/buttons on casing */}
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1 bg-[#8a857a] border border-white rounded-[1px]" />
            <span className="w-1.5 h-1 bg-[#8a857a] border border-white rounded-[1px]" />
            <button className="w-2.5 h-2.5 bg-zinc-400 hover:bg-zinc-500 border border-white active:scale-95 rounded-full" />
          </div>

          {/* LED Indicator and power button */}
          <div className="flex items-center gap-1">
            {/* Status led: green for active active, orange/amber for empty */}
            <span 
              className={`w-1.5 h-1.5 rounded-full border border-black/40 ${
                status === 'active' 
                  ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' 
                  : 'bg-amber-500 shadow-[0_0_4px_#f59e0b]'
              }`} 
              title={status === 'active' ? 'Signal Active' : 'Idle'}
            />
            {/* Glossy beveled power key button */}
            <span className="w-2 h-2 bg-[#d4d0c8] border border-white border-r-[#8a857a] border-b-[#8a857a] rounded-[1px] shadow-sm flex items-center justify-center">
              <span className="text-[5px] text-zinc-500 font-sans">⏽</span>
            </span>
          </div>
        </div>
      </div>

      {/* Monitor Pedestal Base Stand */}
      <div 
         className="w-[60px] h-[10px] bg-[#d7d3c9] border-r-2 border-l-2 border-[#b0aca2] relative"
         style={{
           boxShadow: 'inset 0px 4px 6px rgba(0,0,0,0.15)'
         }}
      />
      {/* Bottom plate mount and soft drop shadow */}
      <div 
         className="w-[96px] h-[6px] bg-[#a7a297] border border-white rounded-t-md shadow-md"
         style={{
           boxShadow: 'inset 1px 1px 0px #e7e3da'
         }}
      />
    </div>
  );
}
