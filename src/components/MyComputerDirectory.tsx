import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, Terminal, HelpCircle } from 'lucide-react';
import { playClickSound, playBubbleSound } from '../utils/audio';

interface MyComputerDirectoryProps {
  onLaunchApp: (appId: string) => void;
  onOpenTextFile: (title: string, content: string) => void;
  onChangeWallpaper: (theme: 'bliss' | 'autumn' | 'cosmic') => void;
  savedDrawings: { filename: string; dataUrl: string }[];
}

export default function MyComputerDirectory({
  onLaunchApp,
  onOpenTextFile,
  onChangeWallpaper,
  savedDrawings
}: MyComputerDirectoryProps) {
  // Navigation stack: 'root' | 'games' | 'wallpapers' | 'eggs' | 'pictures'
  const [currentPath, setCurrentPath] = useState<'root' | 'games' | 'wallpapers' | 'eggs' | 'pictures'>('root');

  const handleDoubleFolderClick = (path: 'games' | 'wallpapers' | 'eggs' | 'pictures') => {
    playClickSound();
    setCurrentPath(path);
  };

  const fileLogs = {
    cheatsText: `★ CUBIC SYSTEMS DOS CHEATS DIARY ★
------------------------------
Enter secret codes in the Start -> Run command prompt to activate easter eggs, diagnostic readouts, or raining block matrices!

Known codes as of 2004:
- "winver" : Displays classic diagnostic licensing tribute.
- "matrix" : Activates falling rain system.
- "synth"  : Performs a chord arpeggio sweeping note test.
- "bliss"  : Instantly restores Bliss Green Hill background.`,

    loreText: `★ CUBIC GAMES CORPORATION LORE ★
-------------------------------
Established in the golden era of 16-bit cathode displays.
Our primary mandate is protecting curved monitors from burning persistent images by projecting colorful, interactive cube grids.

Remember:
- Do NOT delete the files inside system32 folder or you might see screen static.
- Always save paint masterworks into Desktop before turning off computer.`
  };

  return (
    <div className="flex flex-col bg-white text-black h-full select-none font-sans text-xs" id="directory-panel-inner">
      {/* Directory Location header strip */}
      <div className="flex items-center gap-2 bg-[#d4d0c8] border-b border-zinc-300 py-1.5 px-3 select-none" id="directory-navbar">
        <button
          onClick={() => { playClickSound(); setCurrentPath('root'); }}
          disabled={currentPath === 'root'}
          className={`px-2 py-0.5 border border-transparent rounded-[2.5px] font-bold ${
            currentPath === 'root' 
              ? 'text-zinc-400 cursor-not-allowed' 
              : 'hover:bg-zinc-200 text-blue-800'
          }`}
        >
          🗂️ Up One Level
        </button>
        <span className="text-zinc-400">|</span>
        <div className="flex items-center gap-1 font-mono text-[10.5px] text-zinc-600 bg-white border border-zinc-400 border-t-zinc-500 border-l-zinc-500 px-2 py-0.5 flex-1 rounded-sm">
          <span>{`C:\\CubicDrive${
            currentPath === 'root' ? '' : `\\${currentPath.toUpperCase()}`
          }`}</span>
        </div>
      </div>

      {/* Grid displays */}
      <div className="flex-1 p-4 bg-white overflow-y-auto" id="directory-grid-view">
        
        {currentPath === 'root' && (
          <div className="grid grid-cols-3 gap-4" id="dir-root-folders">
            {/* Folder 1: Games */}
            <div 
              onDoubleClick={() => handleDoubleFolderClick('games')}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent hover:border-sky-205"
            >
              <span className="text-3xl">📁</span>
              <span className="font-bold text-zinc-800 mt-1 select-none">Games</span>
              <span className="text-[9px] text-zinc-400">3 Apps loaded</span>
            </div>

            {/* Folder 2: Wallpapers */}
            <div 
              onDoubleClick={() => handleDoubleFolderClick('wallpapers')}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent hover:border-sky-205"
            >
              <span className="text-3xl">📁</span>
              <span className="font-bold text-zinc-800 mt-1 select-none">Wallpapers</span>
              <span className="text-[9px] text-zinc-400">XP Retro Themes</span>
            </div>

            {/* Folder 3: Easter Eggs */}
            <div 
              onDoubleClick={() => handleDoubleFolderClick('eggs')}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent hover:border-sky-205"
            >
              <span className="text-3xl">📁</span>
              <span className="font-bold text-zinc-800 mt-1 select-none">Easter_Eggs</span>
              <span className="text-[9px] text-zinc-400">2 Text files</span>
            </div>

            {/* Folder 4: Saved Pictures */}
            <div 
              onDoubleClick={() => handleDoubleFolderClick('pictures')}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent hover:border-sky-205"
            >
              <span className="text-3xl">📁</span>
              <span className="font-bold text-zinc-800 mt-1 select-none">My Pictures</span>
              <span className="text-[9px] text-zinc-400">{savedDrawings.length} Saved images</span>
            </div>
          </div>
        )}

        {currentPath === 'games' && (
          <div className="grid grid-cols-3 gap-4" id="dir-games-items">
            <div 
              onDoubleClick={() => { playClickSound(); onLaunchApp('cubic-blocks'); }}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent"
            >
              <span className="text-3xl">🧱</span>
              <span className="font-semibold text-zinc-800 mt-1">Cubic Blocks</span>
              <span className="text-[8.5px] text-emerald-600 font-bold uppercase">ARCADE</span>
            </div>

            <div 
              onDoubleClick={() => { playClickSound(); onLaunchApp('minesweeper'); }}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent"
            >
              <span className="text-3xl">💣</span>
              <span className="font-semibold text-zinc-800 mt-1">Minesweeper Alpha</span>
              <span className="text-[8.5px] text-red-600 font-bold uppercase">PUZZLE</span>
            </div>

            <div 
              onDoubleClick={() => { playClickSound(); onLaunchApp('cubic-paint'); }}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent"
            >
              <span className="text-3xl">🎨</span>
              <span className="font-semibold text-zinc-800 mt-1">Cubic Paint Pro</span>
              <span className="text-[8.5px] text-blue-605 font-bold uppercase">DESIGN</span>
            </div>
          </div>
        )}

        {currentPath === 'wallpapers' && (
          <div className="flex flex-col gap-2.5" id="dir-wallpapers-items">
            <div className="text-[9.5px] text-zinc-400 font-bold uppercase mb-1 border-b pb-1 select-none">Select Workspace Skin Theme:</div>
            
            <button 
              onClick={() => { playBubbleSound(); onChangeWallpaper('bliss'); }}
              className="text-left w-full p-2 bg-gradient-to-r from-emerald-100 to-sky-100 hover:brightness-95 border border-zinc-200 rounded flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-[#115b24] text-xs">🏞️ Windows XP Bliss Green</span>
                <span className="text-[9px] text-zinc-500">The iconic rolling green carpet and fluffy cirrus clouds</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#115b24]" />
            </button>

            <button 
              onClick={() => { playBubbleSound(); onChangeWallpaper('autumn'); }}
              className="text-left w-full p-2 bg-gradient-to-r from-amber-100 to-orange-100 hover:brightness-95 border border-zinc-200 rounded flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-[#c0590a] text-xs">🍂 Retro Autumn Gold</span>
                <span className="text-[9px] text-zinc-500">Beautiful classic golden woodland tree in minimalist light</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c0590a]" />
            </button>

            <button 
              onClick={() => { playBubbleSound(); onChangeWallpaper('cosmic'); }}
              className="text-left w-full p-2 bg-gradient-to-r from-indigo-150 to-[#2e1065]/20 hover:brightness-95 border border-zinc-200 rounded flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-blue-900 text-xs">🌌 Starry Cosmic Slate</span>
                <span className="text-[9px] text-zinc-500">Ambient space dust and glowing nebula matrix atmosphere</span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-900" />
            </button>
          </div>
        )}

        {currentPath === 'eggs' && (
          <div className="grid grid-cols-2 gap-4" id="dir-eggs-items">
            <div 
              onDoubleClick={() => { 
                playClickSound(); 
                onOpenTextFile('cheatsText.txt', fileLogs.cheatsText); 
              }}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent"
            >
              <span className="text-3xl">📝</span>
              <span className="font-semibold text-zinc-800 mt-1 select-none">cheatcode_diary.txt</span>
              <span className="text-[8.5px] text-zinc-400">1.2 KB text note</span>
            </div>

            <div 
              onDoubleClick={() => { 
                playClickSound(); 
                onOpenTextFile('system32_lore.txt', fileLogs.loreText); 
              }}
              className="flex flex-col items-center text-center p-2 rounded cursor-pointer hover:bg-sky-50 transition-all border border-transparent"
            >
              <span className="text-3xl">📝</span>
              <span className="font-semibold text-zinc-800 mt-1 select-none">system32_lore.txt</span>
              <span className="text-[8.5px] text-zinc-400">0.9 KB text note</span>
            </div>
          </div>
        )}

        {currentPath === 'pictures' && (
          <div className="grid grid-cols-3 gap-3" id="dir-pictures-items">
            {savedDrawings.length === 0 ? (
              <div className="col-span-3 py-10 text-center flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                <HelpCircle className="w-8 h-8 text-zinc-300 animate-pulse" />
                <span className="font-mono text-[10px]">No images exported. Save images inside Cubic Paint Pro to stock folders!</span>
              </div>
            ) : (
              savedDrawings.map((draw, idz) => (
                <div 
                  key={idz}
                  className="p-1 border border-zinc-300 bg-zinc-50 rounded flex flex-col items-center justify-center text-center hover:bg-sky-50 transition-all"
                  id={`saved-img-thumb-${idz}`}
                >
                  <div className="w-16 h-12 bg-white flex items-center justify-center rounded overflow-hidden shadow-sm">
                    <img src={draw.dataUrl} alt={draw.filename} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-1 select-none truncate w-full px-1">{draw.filename}</span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
