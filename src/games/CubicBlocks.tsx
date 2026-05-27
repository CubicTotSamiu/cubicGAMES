import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Award, ChevronLeft, ChevronRight, ChevronDown, RotateCw } from 'lucide-react';
import { playClickSound, playErrorSound, playBubbleSound } from '../utils/audio';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 18;

// Classic shapes
const SHAPES = [
  [[1, 1, 1, 1]], // I-shape
  [[1, 1, 1], [0, 1, 0]], // T-shape
  [[1, 1, 1], [1, 0, 0]], // L-shape
  [[1, 1, 1], [0, 0, 1]], // J-shape
  [[1, 1], [1, 1]], // O-shape
  [[1, 1, 0], [0, 1, 1]], // Z-shape
  [[0, 1, 1], [1, 1, 0]]  // S-shape
];

const COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#fbbf24', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316'  // orange
];

export default function CubicBlocks() {
  const [grid, setGrid] = useState<number[][]>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('cubic_blocks_highscore');
    return saved ? parseInt(saved, 10) : 1000;
  });
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(1);
  
  // Current piece ref/state to avoid stale state in timers
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    colorIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const gameLoopRef = useRef<number | null>(null);
  const speed = Math.max(100, 800 - (level - 1) * 100);

  // Spawn a random new piece
  const spawnPiece = () => {
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    const pieceShape = SHAPES[shapeIdx];
    const colorIdx = shapeIdx;
    const px = Math.floor((COLS - pieceShape[0].length) / 2);
    const py = 0;

    // Check collision right away -> Game Over
    if (checkCollision(pieceShape, px, py, grid)) {
      setIsGameOver(true);
      setIsPlaying(false);
      playErrorSound();
      return null;
    }

    const newPiece = { shape: pieceShape, colorIndex: colorIdx, x: px, y: py };
    setCurrentPiece(newPiece);
    return newPiece;
  };

  // Check collision with walls or landed blocks
  const checkCollision = (shape: number[][], offsetX: number, offsetY: number, currentGrid: number[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nextX = offsetX + c;
          const nextY = offsetY + r;

          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }
          if (nextY >= 0 && currentGrid[nextY][nextX] > 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Move left/right/down
  const move = (dir: number) => {
    if (!isPlaying || isGameOver || !currentPiece) return;
    
    playClickSound();
    const nextX = currentPiece.x + dir;
    if (!checkCollision(currentPiece.shape, nextX, currentPiece.y, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, x: nextX } : null);
    }
  };

  // Rotate piece
  const rotate = () => {
    if (!isPlaying || isGameOver || !currentPiece) return;
    playClickSound();

    const shape = currentPiece.shape;
    const n = shape.length;
    const m = shape[0].length;
    
    // Create transposed & reversed matrix (90 degrees clockwise rotate)
    const rotated = Array(m).fill(null).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        rotated[c][n - 1 - r] = shape[r][c];
      }
    }

    // Dynamic wall kick: try standard pos, or nudged left/right if collision occurs
    let nextX = currentPiece.x;
    if (checkCollision(rotated, nextX, currentPiece.y, grid)) {
      if (!checkCollision(rotated, nextX - 1, currentPiece.y, grid)) {
        nextX -= 1;
      } else if (!checkCollision(rotated, nextX + 1, currentPiece.y, grid)) {
        nextX += 1;
      } else {
        return; // Can't rotate
      }
    }

    setCurrentPiece(prev => prev ? { ...prev, shape: rotated, x: nextX } : null);
  };

  // Custom key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      if (e.key === 'ArrowLeft') {
        move(-1);
      } else if (e.key === 'ArrowRight') {
        move(1);
      } else if (e.key === 'ArrowDown') {
        drop();
      } else if (e.key === 'ArrowUp') {
        rotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, currentPiece, grid]);

  // Drop down by one step
  const drop = () => {
    if (!isPlaying || isGameOver || !currentPiece) return;

    const nextY = currentPiece.y + 1;
    if (!checkCollision(currentPiece.shape, currentPiece.x, nextY, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, y: nextY } : null);
    } else {
      // Merge with grid
      lockPiece();
    }
  };

  const lockPiece = () => {
    if (!currentPiece) return;

    const newGrid = grid.map(row => [...row]);
    const { shape, colorIndex, x, y } = currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gridY = y + r;
          const gridX = x + c;
          if (gridY >= 0 && gridY < ROWS) {
            newGrid[gridY][gridX] = colorIndex + 1; // 1-indexed for color
          }
        }
      }
    }

    // Check full lines
    let cleared = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(val => val > 0);
      if (isFull) cleared++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    if (cleared > 0) {
      playBubbleSound();
      const points = [0, 100, 300, 500, 800];
      const addedScore = points[cleared] * level;
      setScore(prev => {
        const next = prev + addedScore;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('cubic_blocks_highscore', next.toString());
        }
        return next;
      });
      setLinesCleared(prev => {
        const next = prev + cleared;
        const nextLevel = Math.floor(next / 10) + 1;
        setLevel(nextLevel);
        return next;
      });
    }

    setGrid(filteredGrid);
    const spawned = spawnPiece();
    if (!spawned) {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  };

  // Game loop interval
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      drop();
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, currentPiece, grid, speed]);

  const startGame = () => {
    playClickSound();
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    setIsGameOver(false);
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setIsPlaying(true);
    // Trigger first piece spawn
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    setCurrentPiece({
      shape: SHAPES[shapeIdx],
      colorIndex: shapeIdx,
      x: Math.floor((COLS - SHAPES[shapeIdx][0].length) / 2),
      y: 0
    });
  };

  const pauseGame = () => {
    playClickSound();
    setIsPlaying(prev => !prev);
  };

  // Render composite display details
  const displayGrid = grid.map(row => [...row]);
  if (currentPiece && isPlaying && !isGameOver) {
    const { shape, colorIndex, x, y } = currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const gridY = y + r;
          const gridX = x + c;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            displayGrid[gridY][gridX] = colorIndex + 1;
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-[#d4d0c8] p-3 text-sm select-none items-stretch gap-4 h-full" id="cubic-blocks-container">
      {/* Left Column: Stats & Controls */}
      <div className="flex flex-col gap-3 md:w-48 justify-between flex-shrink-0" id="cubic-blocks-left-col">
        {/* Game Title Plate */}
        <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white py-1 px-2 font-bold flex items-center gap-1 shadow-sm rounded-sm" id="game-title-header">
          <Award className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span className="font-mono text-xs uppercase tracking-wider">Cubic Blocks</span>
        </div>

        {/* Windows Style Panels / Group Boxes */}
        <div className="flex flex-col gap-2 bg-[#d4d0c8] text-[#000]" id="game-stats-group">
          {/* High Score */}
          <div className="border border-white border-t-zinc-600 border-l-zinc-600 bg-zinc-100 p-2 font-mono flex flex-col shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)] rounded-sm">
            <span className="text-[10px] text-zinc-500 uppercase font-sans">High Score</span>
            <span className="text-lg font-bold text-blue-800 tracking-wider">
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>

          {/* Current Score */}
          <div className="border border-white border-t-zinc-600 border-l-zinc-600 bg-zinc-100 p-2 font-mono flex flex-col shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)] rounded-sm">
            <span className="text-[10px] text-zinc-500 uppercase font-sans">Current Score</span>
            <span className="text-lg font-bold text-emerald-700 tracking-wider">
              {score.toString().padStart(6, '0')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Level */}
            <div className="border border-white border-t-zinc-600 border-l-zinc-600 bg-zinc-100 p-1 font-mono flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 font-sans">LEVEL</span>
              <span className="text-md font-bold">{level}</span>
            </div>
            {/* Lines */}
            <div className="border border-white border-t-zinc-600 border-l-zinc-600 bg-zinc-100 p-1 font-mono flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 font-sans">LINES</span>
              <span className="text-md font-bold text-amber-600">{linesCleared}</span>
            </div>
          </div>
        </div>

        {/* Console Action Buttons */}
        <div className="flex flex-col gap-2 mt-auto" id="game-actions-group">
          {!isPlaying && !isGameOver ? (
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-bold py-2 px-3 border-2 border-white border-r-zinc-800 border-b-zinc-800 rounded-sm active:border-zinc-800 active:border-r-white active:border-b-white hover:brightness-105 shadow-sm inline-flex items-center justify-center gap-1"
              id="xp-btn-start-game"
            >
              <Play className="w-4 h-4" /> PLAY GAME
            </button>
          ) : (
            <div className="flex flex-col gap-1 w-full" id="game-running-controls">
              <button
                onClick={pauseGame}
                className="w-full bg-[#d4d0c8] hover:bg-[#c0c0c0] font-bold py-1.5 px-2 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded-sm text-xs font-mono"
              >
                {isPlaying ? 'PAUSE GAME' : 'RESUME GAME'}
              </button>
              <button
                onClick={startGame}
                className="w-full bg-[#d4d0c8] hover:bg-[#c0c0c0] font-medium py-1 px-2 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded-sm text-xs flex items-center justify-center gap-1 font-mono text-zinc-700"
              >
                <RotateCcw className="w-3 h-3" /> RESET
              </button>
            </div>
          )}

          {/* Controller Guide */}
          <div className="hidden md:block border border-zinc-400 p-2 bg-zinc-50 text-[10px] text-zinc-600 font-mono leading-tight shadow-inner rounded-sm">
            <div className="font-bold text-zinc-700 mb-1 border-b pb-1">KEYBOARD CONTROLS:</div>
            <div>← / → : Move Cube</div>
            <div>↑ : Rotate piece</div>
            <div>↓ : Soft drop</div>
          </div>
        </div>
      </div>

      {/* Center Column: Game Grid / Screen */}
      <div className="flex-1 flex justify-center items-center" id="cubic-blocks-board-wrap">
        <div className="border-4 border-[#808080] border-t-[#404040] border-l-[#404040] border-r-[#f0f0f0] border-b-[#f0f0f0] p-1 bg-[#111] overflow-hidden relative shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] max-w-full">
          {/* CRT Screen Scanlines effect inside player board */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/20 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-20" />

          {/* Grid canvas layout */}
          <div
            className="grid gap-[1px] bg-zinc-900 border border-zinc-900"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              width: `${COLS * BLOCK_SIZE}px`,
              height: `${ROWS * BLOCK_SIZE}px`,
            }}
          >
            {displayGrid.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="relative rounded-sm transition-all duration-100"
                  style={{
                    backgroundColor: cell > 0 ? COLORS[cell - 1] : 'rgba(15, 23, 42, 0.45)',
                    boxShadow: cell > 0 ? 'inset 1.5px 1.5px 0px rgba(255,255,255,0.7), inset -1.5px -1.5px 0px rgba(0,0,0,0.5)' : 'none',
                    border: cell > 0 ? '1px solid rgba(0,0,0,0.45)' : '1px solid rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Glowing core for block tiles for retro CRT look */}
                  {cell > 0 && (
                    <div className="absolute inset-[3px] bg-white/20 rounded-sm pointer-events-none" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Overlays (Pause, Game Over, Intro) */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-30 font-mono text-center">
              <span className="text-emerald-400 text-sm tracking-wider font-extrabold mb-1">CUBIC BLOCKS v1.04</span>
              <span className="text-zinc-400 text-[11px] mb-4">A CLASSIC BLOCK FALLING PUZZLE</span>
              <button
                onClick={startGame}
                className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-4 py-2 border-2 border-zinc-600 rounded-md font-bold active:scale-95 text-xs animate-pulse font-mono flex items-center gap-1 shadow-md"
              >
                <Play className="w-3 h-3 text-emerald-400" /> [ START ARCADE ]
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-4 z-30 font-mono text-center animate-fade-in text-white border-2 border-red-500 rounded-sm">
              <span className="text-red-500 font-extrabold text-lg tracking-widest uppercase animate-bounce">Game Over</span>
              <span className="text-zinc-300 text-xs mt-1 mb-4">You stacked up to the sky!</span>
              <div className="bg-black/40 border border-red-900 px-3 py-1.5 rounded-sm text-xs mb-4">
                FINAL SCORE: <span className="text-yellow-400 font-bold">{score}</span>
              </div>
              <button
                onClick={startGame}
                className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 border-2 border-red-500 rounded-sm text-xs font-bold active:scale-95 font-mono"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {!isGameOver && isPlaying && !currentPiece && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-30 font-mono text-zinc-400 text-center text-xs">
              LOADING SYSTEM...
            </div>
          )}
        </div>
      </div>

      {/* Right Column/Bottom row: Mobile on-screen controllers */}
      <div className="flex md:hidden justify-center items-center gap-2 p-2 bg-zinc-300 border border-zinc-400 rounded-sm" id="game-mobile-dpad">
        <button
          onClick={() => move(-1)}
          className="p-3 bg-zinc-200 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={rotate}
          className="p-3 bg-zinc-200 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-100 flex flex-col items-center text-[9px] font-bold"
        >
          <RotateCw className="w-5 h-5 mb-0.5" />
          ROTATE
        </button>
        <button
          onClick={drop}
          className="p-3 bg-zinc-200 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-100"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => move(1)}
          className="p-3 bg-zinc-200 border-2 border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
