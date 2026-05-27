import React, { useState, useEffect } from 'react';
import { Terminal, Award, Folder, Cpu, FileText, CheckCircle, Trash2, HelpCircle } from 'lucide-react';
import { AppWindow, DesktopIconType } from './types';
import Window from './components/Window';
import DesktopIcon from './components/DesktopIcon';
import CrtMonitorView from './components/CrtMonitorView';
import StartMenu from './components/StartMenu';
import Taskbar from './components/Taskbar';
import CubicBlocks from './games/CubicBlocks';
import RetroPaint from './games/RetroPaint';
import Minesweeper from './games/Minesweeper';
import InternetExplorerView from './components/InternetExplorerView';
import MyComputerDirectory from './components/MyComputerDirectory';
import { playStartupSound, playClickSound, playErrorSound, playBubbleSound } from './utils/audio';

export default function App() {
  // Boot Sequence States
  const [bootStep, setBootStep] = useState<'bios' | 'loading' | 'welcome' | 'desktop'>('bios');
  const [ramCount, setRamCount] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [isPowerOff, setIsPowerOff] = useState(false);
  const [matrixSaver, setMatrixSaver] = useState(false);
  
  // Custom OS options
  const [isCrtFilterOn, setIsCrtFilterOn] = useState(true);
  const [wallpaperTheme, setWallpaperTheme] = useState<'bliss' | 'autumn' | 'cosmic'>('bliss');
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // Trash & Custom Notepad State
  const [recycleBinFileList, setRecycleBinFileList] = useState<string[]>([
    'Ugly Pixel Gradient.bmp',
    'Old DirectX 9 manual.pdf',
    'Win98 Explorer crash cache.log'
  ]);
  const [notepadTitle, setNotepadTitle] = useState('NewNote.txt');
  const [notepadContent, setNotepadContent] = useState('Write anything retro here...');
  const [runInput, setRunInput] = useState('');

  // Local Drawings collection
  const [savedDrawings, setSavedDrawings] = useState<{ filename: string; dataUrl: string }[]>([]);

  // Floating Window Management State
  const [nextZIndex, setNextZIndex] = useState(10);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [windows, setWindows] = useState<AppWindow[]>([
    {
      id: 'my-computer',
      title: 'My Computer',
      icon: '📁',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 100, y: 40, width: 440, height: 350, defaultWidth: 440, defaultHeight: 350,
      zIndex: 1
    },
    {
      id: 'internet-explorer',
      title: 'Internet Explorer 6.0',
      icon: '🌐',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 60, y: 30, width: 620, height: 460, defaultWidth: 620, defaultHeight: 460,
      zIndex: 1
    },
    {
      id: 'cubic-blocks',
      title: 'Cubic Blocks Arcade',
      icon: '🧱',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120, y: 20, width: 450, height: 450, defaultWidth: 450, defaultHeight: 450,
      zIndex: 1
    },
    {
      id: 'cubic-paint',
      title: 'Cubic Paint Pro',
      icon: '🎨',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 90, y: 50, width: 540, height: 420, defaultWidth: 540, defaultHeight: 420,
      zIndex: 1
    },
    {
      id: 'minesweeper',
      title: 'Minesweeper Alpha',
      icon: '💣',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 200, y: 60, width: 280, height: 370, defaultWidth: 280, defaultHeight: 370,
      zIndex: 1
    },
    {
      id: 'notepad',
      title: 'Notepad.exe',
      icon: '📝',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 160, y: 90, width: 380, height: 320, defaultWidth: 380, defaultHeight: 320,
      zIndex: 1
    },
    {
      id: 'recycle-bin',
      title: 'Recycle Bin',
      icon: '🗑️',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 140, y: 110, width: 340, height: 260, defaultWidth: 340, defaultHeight: 260,
      zIndex: 1
    },
    {
      id: 'run',
      title: 'Run command',
      icon: '🏃',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 50, y: 200, width: 335, height: 180, defaultWidth: 335, defaultHeight: 180,
      zIndex: 1
    }
  ]);

  // Desktop Icons Configuration
  const [desktopIcons, setDesktopIcons] = useState<DesktopIconType[]>([
    { id: 'icon-comp', title: 'My Computer', icon: '💻', type: 'app', action: 'my-computer' },
    { id: 'icon-ie', title: 'Internet Explorer', icon: '🌐', type: 'app', action: 'internet-explorer' },
    { id: 'icon-paint', title: 'Cubic Paint', icon: '🎨', type: 'app', action: 'cubic-paint' },
    { id: 'icon-blocks', title: 'Cubic Blocks', icon: '🧱', type: 'app', action: 'cubic-blocks' },
    { id: 'icon-mines', title: 'Minesweeper', icon: '💣', type: 'app', action: 'minesweeper' },
    { id: 'icon-bin', title: 'Recycle Bin', icon: '🗑️', type: 'app', action: 'recycle-bin' }
  ]);

  // Handle BIOS RAM sequence ticking
  useEffect(() => {
    if (bootStep === 'bios') {
      const interval = setInterval(() => {
        setRamCount(prev => {
          if (prev >= 262144) {
            clearInterval(interval);
            setTimeout(() => {
              setBootStep('loading');
            }, 700);
            return 262144;
          }
          return prev + 16384;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [bootStep]);

  // Handle Windows Progress Bar loading progression
  useEffect(() => {
    if (bootStep === 'loading') {
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setBootStep('welcome');
              playStartupSound();
            }, 500);
            return 100;
          }
          return prev + 15;
        });
      }, 350);
      return () => clearInterval(interval);
    }
  }, [bootStep]);

  // Handle Welcome Screen screen reveal
  useEffect(() => {
    if (bootStep === 'welcome') {
      const timer = setTimeout(() => {
        setBootStep('desktop');
      }, 2300);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  // Listen to Start Menu Shutdown Triggers
  useEffect(() => {
    const handleShutdown = () => {
      setIsPowerOff(true);
    };
    window.addEventListener('xp-shutdown-trigger', handleShutdown);
    return () => window.removeEventListener('xp-shutdown-trigger', handleShutdown);
  }, []);

  // System actions for opening/closing/focusing windows
  const openWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => {
        if (win.id === id) {
          const updatedZ = nextZIndex + 1;
          setNextZIndex(updatedZ);
          setActiveWindowId(id);
          return { ...win, isOpen: true, isMinimized: false, zIndex: updatedZ };
        }
        return win;
      })
    );
  };

  const closeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, isOpen: false } : win))
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, isMinimized: true } : win))
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const maximizeWindow = (id: string) => {
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, isMaximized: !win.isMaximized } : win))
    );
  };

  const focusWindow = (id: string) => {
    const updatedZ = nextZIndex + 1;
    setNextZIndex(updatedZ);
    setActiveWindowId(id);
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, isMinimized: false, zIndex: updatedZ } : win))
    );
  };

  const moveWindow = (id: string, newX: number, newY: number) => {
    setWindows(prev =>
      prev.map(win => (win.id === id ? { ...win, x: newX, y: newY } : win))
    );
  };

  // Click taskbar tab (minimize or focus)
  const toggleWindowState = (id: string) => {
    const target = windows.find(win => win.id === id);
    if (!target) return;

    if (target.id === activeWindowId && !target.isMinimized) {
      // If of focus, minimize
      minimizeWindow(id);
    } else {
      // Restore and focus
      focusWindow(id);
    }
  };

  // Run command handler
  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runInput.trim()) return;

    const command = runInput.trim().toLowerCase();
    setRunInput('');

    if (command === 'matrix') {
      playBubbleSound();
      setMatrixSaver(true);
      closeWindow('run');
    } else if (command === 'bliss') {
      playBubbleSound();
      setWallpaperTheme('bliss');
      closeWindow('run');
    } else if (command === 'winver') {
      playBubbleSound();
      alert('★ Windows XP - cubic.games Edition v1.04 ★\n\nBuilt entirely for nostalgic retro gaming curvature recreation in 2026.\nLicensed under compact CD-ROM gaming registries.');
      closeWindow('run');
    } else if (command === 'synth') {
      playBubbleSound();
      // Sound sweeps trigger is handled directly in audio synthesis
      closeWindow('run');
    } else if (['paint', 'paint.exe', 'mspaint', 'cubic-paint'].includes(command)) {
      openWindow('cubic-paint');
      closeWindow('run');
    } else if (['blocks', 'cubic-blocks'].includes(command)) {
      openWindow('cubic-blocks');
      closeWindow('run');
    } else if (['mines', 'minesweeper'].includes(command)) {
      openWindow('minesweeper');
      closeWindow('run');
    } else {
      playErrorSound();
      alert(`Windows cannot find "${command}". Make sure you typed the name correctly, or try typing commands like "matrix", "bliss", or "winver"!`);
    }
  };

  // Empty Trash command
  const handleEmptyTrash = () => {
    playClickSound();
    setRecycleBinFileList([]);
  };

  // Callback to handle file painting saved in MS Paint
  const handleSavePaintFile = (filename: string, dataUrl: string) => {
    // Add to saved pictures directory list
    setSavedDrawings(prev => [...prev, { filename, dataUrl }]);

    // Map a cute new shortcut icon on desktop
    const newDesktopShortcut: DesktopIconType = {
      id: `shortcut-drawing-${Date.now()}`,
      title: filename,
      icon: dataUrl, // uses dynamic image src
      type: 'file',
      action: `review-paint-${filename}`
    };

    setDesktopIcons(prev => [...prev, newDesktopShortcut]);

    // Focus desktop to see it
    playBubbleSound();
  };

  // Double click drawings on desktop starts an image viewer notepad representation!
  const handleOpenDesktopShortcut = (action: string) => {
    if (action.startsWith('review-paint-')) {
      const filename = action.replace('review-paint-', '');
      const drawing = savedDrawings.find(d => d.filename === filename);
      if (drawing) {
        setNotepadTitle(filename);
        setNotepadContent(`--- PIXEL ART METADATA ---
File name: ${filename}
Dimensions: 440 x 300 (Beveled)
Encoding: Base64 Canvas data block

[ Image preview is stored in Virtual C:\\ DRIVE folder ]`);
        openWindow('notepad');
      }
    } else {
      openWindow(action);
    }
  };

  const handleOpenFolderTextDocument = (title: string, content: string) => {
    setNotepadTitle(title);
    setNotepadContent(content);
    openWindow('notepad');
  };

  // Quick bypass boot trigger
  const skipBootAndEnter = () => {
    playStartupSound();
    setBootStep('desktop');
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden select-none select-none bg-black text-white font-sans ${
        isCrtFilterOn ? 'crt-scanlines crt-bloom' : ''
      }`}
      id="aistudio-retro-workspace"
    >
      {/* 1. BIOS BOOT STEP */}
      {bootStep === 'bios' && (
        <div 
          onClick={skipBootAndEnter}
          className="absolute inset-0 bg-black text-[#ffffe0] font-mono p-4 sm:p-8 text-xs sm:text-sm leading-relaxed flex flex-col justify-between cursor-pointer select-none"
          id="boot-bios-screen"
        >
          <div className="flex flex-col gap-1 z-10">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-2">
              <span className="font-bold text-lg flex items-center gap-1">
                <Terminal className="w-5 h-5 text-zinc-400" /> Award Modular BIOS v6.00PG
              </span>
              <Award className="w-8 h-8 text-zinc-500" />
            </div>
            <div>An Energy Star Ally, Copyright (C) 1984-2004, Award Software, Inc.</div>
            <div className="mt-4 text-zinc-300">Cubic Core Intel(R) CPU v2.04 Detected at x86 Arch</div>
            <div className="text-[#00ffff]">Memory Test : {ramCount} KB OK (SDR SDRAM)</div>
            <div className="mt-4">Primary Master : CUBIC DISK LBA-04</div>
            <div>Secondary Master : ATAPI CD-ROM PORT-3000</div>
            
            <div className="mt-6 text-zinc-400">
              Detecting IDE drives... OK<br/>
              Searching for Boot Record from IDE-0... OK
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 select-none animate-pulse">
            <span>[ CLICK SCREEN TO SKIP BOOT DIAGNOSTIC ]</span>
            <span>May 2004 Edition</span>
          </div>
        </div>
      )}

      {/* 2. WINDOWS XP LOADING BAR STEP */}
      {bootStep === 'loading' && (
        <div 
          onClick={skipBootAndEnter}
          className="absolute inset-0 bg-black flex flex-col items-center justify-center p-4 cursor-pointer select-none"
          id="boot-loading-screen"
        >
          {/* Logo container */}
          <div className="flex flex-col items-center mb-10 text-center select-none animate-pulse">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center leading-none italic font-sans relative">
              <span className="text-white">Microsoft</span>
              <span className="text-[#ff9102] ml-1.5">Windows</span>
            </h1>
            <span className="text-sky-400 font-extrabold text-[12px] tracking-widest uppercase mt-0.5">
              XP Professional
            </span>
          </div>

          {/* Progress bar housing beveled */}
          <div className="w-[180px] h-4 border border-zinc-600 p-0.5 bg-black rounded flex items-center overflow-hidden">
            {/* Sliding loading blocks replicate */}
            <div className="flex gap-1 h-full animate-marquee w-full">
              <span className="w-4 h-full bg-[#3d95ff] rounded-sm flex-shrink-0" />
              <span className="w-4 h-full bg-[#3d95ff] rounded-sm flex-shrink-0" />
              <span className="w-4 h-full bg-[#3d95ff] rounded-sm flex-shrink-0" />
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 uppercase font-mono mt-8 select-none">
            [ Loading compact graphics libraries... ]
          </div>
        </div>
      )}

      {/* 3. WELCOME CHIME TEXT STEP */}
      {bootStep === 'welcome' && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-[#0052cd] via-[#0d6ffc] to-[#0052cd] flex items-center justify-center select-none"
          id="boot-welcome-screen"
        >
          <div className="flex flex-col md:flex-row items-center gap-5 justify-center" id="welcome-message-block">
            {/* XP User profile image ring */}
            <div className="w-16 h-16 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center shadow-xl animate-bounce">
              <span className="text-3xl">💻</span>
            </div>
            
            <span className="h-10 w-[1px] bg-sky-200 hidden md:block" />

            <div className="flex flex-col text-center md:text-left text-white leading-tight">
              <span className="text-3xl font-light tracking-wide animate-pulse">welcome</span>
              <span className="text-xs text-sky-200 font-sans mt-0.5">Starting cubic.games console...</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN WINDOWS XP DESKTOP WORKSPACE */}
      {bootStep === 'desktop' && !isPowerOff && (
        <div 
          className={`absolute inset-0 flex flex-col justify-between overflow-hidden select-none geometric-overlay ${
            wallpaperTheme === 'bliss' 
              ? 'geometric-bliss' 
              : wallpaperTheme === 'autumn' 
              ? 'bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#78350f]' 
              : 'bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#030712]'
          }`}
          onClick={() => setSelectedIconId(null)}
          id="desktop-canvas-landscape"
        >
          {/* Ambient animations: Grass gradient shader and drifting cloud icons */}
          {wallpaperTheme === 'bliss' && (
            <>
              {/* Green Bliss landscape hill curve */}
              <div 
                className="absolute bottom-10 left-0 w-full h-[32%] bg-gradient-to-b from-[#15803d] via-[#166534] to-[#14532d] z-0 pointer-events-none rounded-t-[100%] scale-x-125 translate-y-4"
                style={{ filter: 'blur(1px)' }}
              />
              {/* Drifting Clouds */}
              <span className="absolute top-[12%] text-white/10 text-6xl select-none pointer-events-none animate-cloud-slow z-0">☁️</span>
              <span className="absolute top-[28%] text-white/20 text-7xl select-none pointer-events-none animate-cloud-fast z-0">☁️</span>
            </>
          )}

          {/* Desktop Shortcuts Workspace Grid */}
          <div className="flex-1 p-4 relative z-10 flex flex-col md:flex-row gap-6 items-start content-start" id="desktop-items-plate">
            {/* Column A: Left side standard icons list */}
            <div className="flex flex-col gap-3 flex-wrap" id="icons-vertical-strip">
              {desktopIcons.map(icon => (
                <DesktopIcon
                  key={icon.id}
                  id={icon.id}
                  title={icon.title}
                  icon={icon.icon}
                  type={icon.type}
                  action={icon.action}
                  isSelected={selectedIconId === icon.id}
                  onSelect={(id) => setSelectedIconId(id)}
                  onOpen={handleOpenDesktopShortcut}
                />
              ))}
            </div>

            {/* Column B: Primary central shelf gaming catalog - user CRT monitors layout */}
            <div className="flex-1 flex flex-col h-full self-stretch justify-center p-3 z-10" id="crt-shelf-wrap">
              <div className="bg-[#ffffff]/10 border border-white/15 backdrop-blur-sm px-6 py-6 rounded-md flex flex-wrap gap-5 justify-center items-center shadow-lg" id="gaming-crt-shelf">
                <div className="text-center w-full mb-2">
                  <h2 className="font-sans font-bold text-white text-xs tracking-wider uppercase drop-shadow">
                    🎮 Cubic Gaming CD-ROM Shelves (2004) 🎮
                  </h2>
                  <p className="text-[10px] text-zinc-200 mt-0.5">Click any chunky CRT monitor to launch arcade puzzle software</p>
                </div>

                <CrtMonitorView
                  id="mon-1"
                  title="CUBIC BLOCKS"
                  gameSubtitle="BRICKS FALLING v1.0"
                  gameId="cubic-blocks"
                  status="active"
                  previewColor="#312e81"
                  onLaunch={openWindow}
                />

                <CrtMonitorView
                  id="mon-2"
                  title="MINESWEEPER"
                  gameSubtitle="RETRO GRID PUZZLE"
                  gameId="minesweeper"
                  status="active"
                  previewColor="#065f46"
                  onLaunch={openWindow}
                />

                <CrtMonitorView
                  id="mon-3"
                  title="CUBIC PAINT"
                  gameSubtitle="BMP PIXEL CANVAS"
                  gameId="cubic-paint"
                  status="active"
                  previewColor="#831843"
                  onLaunch={openWindow}
                />

                <CrtMonitorView
                  id="mon-4"
                  title="3D PORTAL"
                  gameSubtitle="COMING SOON CD2"
                  gameId="placeholder-empty"
                  status="empty"
                  previewColor="#111"
                  onLaunch={openWindow}
                />
              </div>
            </div>
          </div>

          {/* Draggable Active Floating Windows Frame Stacker */}
          {windows.map(win => (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              icon={win.icon}
              isOpen={win.isOpen}
              isMinimized={win.isMinimized}
              isMaximized={win.isMaximized}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              zIndex={win.zIndex}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onMaximize={maximizeWindow}
              onFocus={focusWindow}
              onMove={moveWindow}
            >
              {/* Route corresponding window body children */}
              {win.id === 'cubic-blocks' && <CubicBlocks />}
              {win.id === 'minesweeper' && <Minesweeper />}
              {win.id === 'cubic-paint' && <RetroPaint onSaveToDesktop={handleSavePaintFile} />}
              {win.id === 'internet-explorer' && <InternetExplorerView />}
              
              {win.id === 'my-computer' && (
                <MyComputerDirectory
                  onLaunchApp={openWindow}
                  onOpenTextFile={handleOpenFolderTextDocument}
                  onChangeWallpaper={(theme) => setWallpaperTheme(theme)}
                  savedDrawings={savedDrawings}
                />
              )}

              {win.id === 'recycle-bin' && (
                <div className="p-3 font-sans h-full flex flex-col justify-between bg-white select-none text-xs">
                  <div className="flex-1 overflow-auto">
                    <span className="font-bold text-zinc-500 block mb-2 uppercase text-[9px] select-all">Recycle Bin Items cache:</span>
                    {recycleBinFileList.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center text-zinc-400 gap-1 select-none">
                        <CheckCircle className="w-8 h-8 text-zinc-300 animate-pulse" />
                        <span>Recycle Bin is empty! Clean as whistle.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {recycleBinFileList.map((filename, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded">
                            <span>📄</span>
                            <span className="font-mono text-[10.5px] text-zinc-800">{filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {recycleBinFileList.length > 0 && (
                    <button 
                      onClick={handleEmptyTrash}
                      className="w-full bg-[#d4d0c8] py-1.5 border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white font-bold flex items-center justify-center gap-1 mt-2.5 rounded shadow-sm text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-600" /> Empty Recycle Bin
                    </button>
                  )}
                </div>
              )}

              {win.id === 'notepad' && (
                <div className="flex flex-col bg-white text-black font-mono text-[11px] h-full" id="notepad-workspace">
                  <div className="bg-[#d4d0c8] py-1 px-2 border-b border-zinc-300 select-none text-[10px] flex gap-3 text-zinc-700 font-sans font-semibold">
                    <span>File</span>
                    <span>Edit</span>
                    <span>Format</span>
                    <span onClick={() => closeWindow('notepad')} className="ml-auto text-red-650 font-bold cursor-pointer">Exit</span>
                  </div>
                  <div className="p-1 px-2 bg-zinc-50 border-b border-zinc-200 text-[10px] text-zinc-400 select-none">
                    Editing <span className="font-bold text-zinc-600">{notepadTitle}</span>
                  </div>
                  <textarea
                    value={notepadContent}
                    onChange={(e) => setNotepadContent(e.target.value)}
                    className="flex-1 p-3 font-mono text-xs leading-relaxed focus:outline-none bg-white text-zinc-855 resize-none overflow-y-auto"
                  />
                </div>
              )}

              {win.id === 'run' && (
                <form onSubmit={handleRunSubmit} className="p-3 bg-[#d4d0c8] text-xs h-full flex flex-col justify-between font-sans">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🏃</span>
                    <div className="flex flex-col gap-1.5 leading-normal">
                      <span>Type matrix or winver in prompt and hit OK.</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold">Open:</span>
                        <input
                          type="text"
                          required
                          value={runInput}
                          onChange={(e) => setRunInput(e.target.value)}
                          placeholder="matrix..."
                          className="flex-1 bg-white border-2 border-zinc-400 p-1 font-mono text-xs focus:outline-none focus:border-blue-600"
                          id="run-input-prompt"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-2">
                    <button 
                      type="submit"
                      className="px-4 py-1 font-bold border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-150"
                    >
                      OK
                    </button>
                    <button 
                      type="button" 
                      onClick={() => closeWindow('run')}
                      className="px-4 py-1 border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-150"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Window>
          ))}

          {/* Start Menu Drawer Overlay */}
          <StartMenu
            isOpen={isStartMenuOpen}
            onClose={() => setIsStartMenuOpen(false)}
            onOpenWindow={openWindow}
          />

          {/* Matrix Screen Saver Layer representation */}
          {matrixSaver && (
            <div 
              onClick={() => { playClickSound(); setMatrixSaver(false); }}
              className="absolute inset-0 bg-black text-[#00ff00] font-mono p-1 px-3 flex flex-col items-center justify-center select-none text-center cursor-pointer z-[9999]"
              id="matrix-saver-canvas"
            >
              <div className="text-[10px] sm:text-xs animate-pulse leading-normal max-w-md">
                <span className="text-red-500 font-bold block text-sm uppercase mb-3">★ CUBIC MATRIX SCREENSAVER ★</span>
                <p className="mb-4">1010111000101110<br/>0101001100010110<br/>CUBIC GATHER ENCRYPTION CODE OK<br/>1010101100010112</p>
                <span className="text-zinc-500 text-[10px] animate-pulse block">[ CLICK SCREEN TO RETURN TO DESKTOP ]</span>
              </div>
            </div>
          )}

          {/* Core System Taskbar strip */}
          <Taskbar
            windows={windows}
            activeWindowId={activeWindowId}
            onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
            onToggleWindow={toggleWindowState}
            isCrtOn={isCrtFilterOn}
            onToggleCrt={() => setIsCrtFilterOn(!isCrtFilterOn)}
          />
        </div>
      )}

      {/* 5. PC OFF / SHUTDOWN TERMINAL SCREEN */}
      {isPowerOff && (
        <div 
          onClick={() => {
            playStartupSound();
            setIsPowerOff(false);
            setBootStep('bios');
          }}
          className="absolute inset-0 bg-black flex flex-col items-center justify-center cursor-pointer select-none text-amber-500 text-center p-6 font-mono font-medium text-xs sm:text-sm"
          id="system-power-off-card"
        >
          <div className="flex flex-col gap-3 min-h-[120px] items-center text-center justify-center border-2 border-dashed border-amber-500/30 p-6 rounded" id="safe-shutdown-box">
            <span className="text-2xl animate-pulse">📼</span>
            <div className="text-amber-500 font-extrabold text-sm sm:text-lg tracking-widest uppercase">
              It is now safe to turn off your computer
            </div>
            <span className="text-zinc-500 text-[10.5px] mt-2 block animate-pulse">
              [ CLICK TO PRESS POWER BUTTON AND REBOOT SYSTEM ]
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
