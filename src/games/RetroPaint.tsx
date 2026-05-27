import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, PaintBucket, Trash2, Save, Sparkles, Smile, HelpCircle, Palette } from 'lucide-react';
import { playClickSound, playBubbleSound, playErrorSound } from '../utils/audio';

interface RetroPaintProps {
  onSaveToDesktop?: (filename: string, dataUrl: string) => void;
}

export default function RetroPaint({ onSaveToDesktop }: RetroPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<'pencil' | 'brush' | 'spray' | 'eraser' | 'bucket'>('brush');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [imageName, setImageName] = useState('MyDrawing');
  
  // Custom paint palette colors
  const paletteColors = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b5e61d', '#96b232', '#ffaec9', '#ffc90e', '#efe4b0', '#b97a57', '#b5e61d', '#7092be'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use specific layout size
    canvas.width = 440;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    contextRef.current = ctx;

    // Fill white background on initial paint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Sync color and size to canvas context
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = activeTool === 'eraser' ? '#ffffff' : brushColor;
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize, activeTool]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (activeTool === 'bucket') {
      floodFill(x, y, brushColor);
      return;
    }

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    
    if (activeTool === 'spray') {
      sprayAt(x, y);
    } else {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (activeTool === 'spray') {
      sprayAt(x, y);
    } else {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  // Spray effect
  const sprayAt = (startX: number, startY: number) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.fillStyle = brushColor;
    
    // Spray radius dots
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (brushSize * 2.5);
      const sx = startX + Math.cos(angle) * radius;
      const sy = startY + Math.sin(angle) * radius;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  };

  // Simple Flood Fill
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    playClickSound();
    const ctx = contextRef.current;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Convert starting coord
    const px = Math.floor(startX);
    const py = Math.floor(startY);
    const startIdx = (py * canvas.width + px) * 4;

    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // Helper to parse target rgb color
    const parseHex = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255
      } : { r: 0, g: 0, b: 0, a: 255 };
    };

    const targetColor = parseHex(fillColor);

    // If target and current match, skip
    if (
      Math.abs(startR - targetColor.r) < 5 &&
      Math.abs(startG - targetColor.g) < 5 &&
      Math.abs(startB - targetColor.b) < 5
    ) {
      return;
    }

    const queue: [number, number][] = [[px, py]];
    const width = canvas.width;
    const height = canvas.height;

    const matchesStartColor = (idx: number) => {
      return (
        Math.abs(data[idx] - startR) < 30 &&
        Math.abs(data[idx + 1] - startG) < 30 &&
        Math.abs(data[idx + 2] - startB) < 30 &&
        Math.abs(data[idx + 3] - startA) < 30
      );
    };

    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const cx = curr[0];
      const cy = curr[1];

      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

      const idx = (cy * width + cx) * 4;
      const visIdx = cy * width + cx;

      if (visited[visIdx]) continue;
      visited[visIdx] = 1;

      if (matchesStartColor(idx)) {
        data[idx] = targetColor.r;
        data[idx + 1] = targetColor.g;
        data[idx + 2] = targetColor.b;
        data[idx + 3] = targetColor.a;

        // Push neighbors
        queue.push([cx + 1, cy]);
        queue.push([cx - 1, cy]);
        queue.push([cx, cy + 1]);
        queue.push([cx, cy - 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    
    playClickSound();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const triggerSaveFlow = () => {
    playClickSound();
    setFileMenuOpen(false);
    setSaveModalOpen(true);
  };

  const handleSaveToDesktop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playBubbleSound();
    const dataUrl = canvas.toDataURL('image/png');
    const fullFilename = imageName.endsWith('.bmp') ? imageName : `${imageName}.bmp`;
    
    if (onSaveToDesktop) {
      onSaveToDesktop(fullFilename, dataUrl);
    }
    
    setSaveModalOpen(false);
  };

  return (
    <div className="flex flex-col bg-[#d4d0c8] select-none text-[#000] font-sans h-full text-xs relative" id="retro-paint-container">
      {/* File/Edit Top Menu Strip */}
      <div className="flex items-center gap-2 border-b border-zinc-400 py-1 px-2 relative" id="paint-menu-bar">
        <div className="relative">
          <button
            onClick={() => {
              playClickSound();
              setFileMenuOpen(!fileMenuOpen);
            }}
            className="px-2 py-0.5 hover:bg-[#0a246a] hover:text-white rounded-sm outline-none cursor-pointer"
            id="paint-file-menu"
          >
            File
          </button>
          
          {fileMenuOpen && (
            <div className="absolute left-0 mt-1 bg-[#d4d0c8] text-black border-2 border-white border-r-zinc-600 border-b-zinc-600 shadow-md py-1 z-50 w-36" id="paint-file-dropdown">
              <button
                onClick={clearCanvas}
                className="w-full text-left px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Canvas
              </button>
              <button
                onClick={triggerSaveFlow}
                className="w-full text-left px-3 py-1 hover:bg-[#0a246a] hover:text-white flex items-center gap-1 border-t border-zinc-400 mt-1"
              >
                <Save className="w-3.5 h-3.5" /> Save to Desktop
              </button>
            </div>
          )}
        </div>
        <span className="text-zinc-400">|</span>
        <button className="px-2 py-0.5 hover:bg-zinc-300 rounded-sm cursor-normal opacity-50">Edit</button>
        <button className="px-2 py-0.5 hover:bg-zinc-300 rounded-sm cursor-normal opacity-50">View</button>
        <button 
          onClick={() => { playClickSound(); alert('Cubic Paint Pro v1.0\n\nDraw pixel art, choose colors, spray paint, and hit File -> Save to Desktop to save files to virtual Drive C!'); }} 
          className="px-2 py-0.5 hover:bg-[#0a246a] hover:text-white rounded-sm cursor-pointer ml-auto"
        >
          Help
        </button>
      </div>

      {/* Main Paint Workspace */}
      <div className="flex flex-1 overflow-hidden" id="paint-workspace-wrap">
        {/* Left Side: MS Paint Classic Layout Tools Rail */}
        <div className="w-10 bg-[#d4d0c8] border-r border-zinc-400 flex flex-col p-1 gap-1 items-center" id="paint-tools-rail">
          {/* Pencil */}
          <button
            onClick={() => { playClickSound(); setActiveTool('pencil'); setBrushSize(2); }}
            className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm ${
              activeTool === 'pencil' 
              ? 'border-zinc-800 bg-zinc-200 shadow-[inset_1.5px_1.5px_2px_rgba(0,0,0,0.3)]' 
              : 'border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white bg-[#d4d0c8]'
            }`}
            title="Pencil"
          >
            <span className="font-bold font-mono text-zinc-800 text-xs">✎</span>
          </button>

          {/* Regular Brush */}
          <button
            onClick={() => { playClickSound(); setActiveTool('brush'); }}
            className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm ${
              activeTool === 'brush' 
              ? 'border-zinc-800 bg-zinc-200 shadow-[inset_1.5px_1.5px_2px_rgba(0,0,0,0.3)]' 
              : 'border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white bg-[#d4d0c8]'
            }`}
            title="Brush"
          >
            <Paintbrush className="w-4 h-4 text-zinc-800" />
          </button>

          {/* Spray Can */}
          <button
            onClick={() => { playClickSound(); setActiveTool('spray'); }}
            className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm ${
              activeTool === 'spray' 
              ? 'border-zinc-800 bg-zinc-200 shadow-[inset_1.5px_1.5px_2px_rgba(0,0,0,0.3)]' 
              : 'border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white bg-[#d4d0c8]'
            }`}
            title="Spray Can"
          >
            <Sparkles className="w-4 h-4 text-[#ec4899]" />
          </button>

          {/* Bucket Fill */}
          <button
            onClick={() => { playClickSound(); setActiveTool('bucket'); }}
            className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm ${
              activeTool === 'bucket' 
              ? 'border-zinc-800 bg-zinc-200 shadow-[inset_1.5px_1.5px_2px_rgba(0,0,0,0.3)]' 
              : 'border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white bg-[#d4d0c8]'
            }`}
            title="Fill Bucket"
          >
            <PaintBucket className="w-4 h-4 text-amber-600" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => { playClickSound(); setActiveTool('eraser'); }}
            className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm ${
              activeTool === 'eraser' 
              ? 'border-zinc-800 bg-zinc-200 shadow-[inset_1.5px_1.5px_2px_rgba(0,0,0,0.3)]' 
              : 'border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white bg-[#d4d0c8]'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4 text-red-500" />
          </button>

          <span className="w-full h-[1px] bg-zinc-400 my-1" />

          {/* Brush Sizes picker box */}
          <div className="flex flex-col gap-1 items-center bg-[#d4d0c8] p-1 border border-zinc-400 rounded-sm w-full" id="paint-size-box">
            {[4, 8, 14, 24].map(size => (
              <button
                key={size}
                onClick={() => { playClickSound(); setBrushSize(size); }}
                className={`w-6 h-6 flex items-center justify-center rounded-sm hover:bg-zinc-200 ${
                  brushSize === size ? 'bg-zinc-300 border border-zinc-500' : ''
                }`}
                title={`Size ${size}px`}
              >
                <div 
                  className="bg-black rounded-full"
                  style={{ width: `${Math.min(size, 16)}px`, height: `${Math.min(size, 16)}px` }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Center Area with classic status gray margin lines */}
        <div className="flex-1 bg-zinc-500 overflow-auto p-3 flex justify-center items-start" id="paint-canvas-wrapper">
          <div className="bg-white border-2 border-zinc-600 shadow-md h-full select-none cursor-crosshair">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="block bg-white max-w-full"
            />
          </div>
        </div>
      </div>

      {/* Footer / Colors SWATCH board */}
      <div className="bg-[#d4d0c8] border-t border-zinc-400 p-2 flex items-center gap-3" id="paint-colors-swatchbar">
        {/* Selected Color Preview box */}
        <div className="flex items-center gap-1.5 flex-shrink-0" id="selected-color-box">
          <div className="border border-white border-t-zinc-600 border-l-zinc-600 p-0.5 bg-zinc-100">
            <div 
              className="w-7 h-7 border border-zinc-400 shadow-sm"
              style={{ backgroundColor: brushColor }}
            />
          </div>
          <div className="text-[10px] leading-tight font-mono">
            COLOR<br/><span className="font-bold font-sans">{brushColor.toUpperCase()}</span>
          </div>
        </div>

        <span className="h-8 w-[1px] bg-zinc-400" />

        {/* Dynamic color buttons grid grid-cols-10 */}
        <div className="grid grid-cols-10 gap-1 flex-1 max-w-[400px]" id="colors-grid">
          {paletteColors.map((col, idx) => (
            <button
              key={`${col}-${idx}`}
              onClick={() => {
                playClickSound();
                setBrushColor(col);
                if (activeTool === 'eraser') setActiveTool('brush');
              }}
              className="w-5 h-5 border border-zinc-400 hover:scale-110 hover:border-black active:scale-95 transition-all shadow-sm rounded-sm"
              style={{ backgroundColor: col }}
              title={col}
            />
          ))}
        </div>

        <button
          onClick={clearCanvas}
          className="ml-auto flex items-center gap-1 bg-[#d4d0c8] hover:bg-zinc-200 text-black py-1 px-2 border-2 border-white border-r-zinc-600 border-b-zinc-600 rounded text-xs active:border-r-white active:border-b-white font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Custom Windows XP Save File Modal Overlay */}
      {saveModalOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[90] p-4 font-sans" id="paint-save-dialog">
          <div className="bg-[#d4d0c8] w-[300px] border-2 border-white border-r-zinc-800 border-b-zinc-800 shadow-2xl rounded-sm">
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white px-2 py-1 flex items-center justify-between font-bold">
              <span>Save File As...</span>
              <button 
                onClick={() => { playClickSound(); setSaveModalOpen(false); }}
                className="w-4 h-4 bg-red-600 rounded-sm text-white font-extrabold flex items-center justify-center text-[10px] border border-red-500 hover:bg-red-500 active:bg-red-700"
              >
                X
              </button>
            </div>
            {/* Content body */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Save className="w-8 h-8 text-blue-700 animate-bounce" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-800">Save drawing to Desktop?</div>
                  <div className="text-zinc-500">This will add a retro image shortcut on your primary workspace.</div>
                </div>
              </div>

              {/* Input name */}
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[10px] uppercase font-bold text-zinc-600">File name:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    className="flex-1 bg-white border-2 border-zinc-400 p-1 font-mono text-xs focus:outline-none focus:border-zinc-800"
                  />
                  <span className="font-mono text-zinc-500">.bmp</span>
                </div>
              </div>

              {/* XP Dialog buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleSaveToDesktop}
                  className="px-4 py-1.5 bg-[#d4d0c8] hover:bg-zinc-200 font-bold border-2 border-white border-r-zinc-850 border-b-zinc-850 active:border-r-white active:border-b-white rounded-sm text-xs"
                >
                  Save
                </button>
                <button
                  onClick={() => { playClickSound(); setSaveModalOpen(false); }}
                  className="px-4 py-1.5 bg-[#d4d0c8] hover:bg-zinc-200 border-2 border-white border-r-zinc-850 border-b-zinc-850 active:border-r-white active:border-b-white rounded-sm text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
