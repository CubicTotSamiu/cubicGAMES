import React, { useState, useEffect, useRef } from 'react';
import { Flag, ShieldAlert, Award, Smile, Frown, RotateCcw, Volume2 } from 'lucide-react';
import { playClickSound, playErrorSound, playBubbleSound } from '../utils/audio';

const BOARD_SIZE = 9;
const MINE_COUNT = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export default function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [minesLeft, setMinesLeft] = useState(MINE_COUNT);
  const [timer, setTimer] = useState(0);
  const [isMobileFlagging, setIsMobileFlagging] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Initialize Board
  const initBoard = () => {
    playClickSound();
    
    // Clear and stop active timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimer(0);
    setMinesLeft(MINE_COUNT);
    setGameState('idle');
    setIsMobileFlagging(false);

    // Create blank board
    const newBoard: Cell[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }

    // Place 10 random mines
    let placedMines = 0;
    while (placedMines < MINE_COUNT) {
      const rr = Math.floor(Math.random() * BOARD_SIZE);
      const cc = Math.floor(Math.random() * BOARD_SIZE);
      if (!newBoard[rr][cc].isMine) {
        newBoard[rr][cc].isMine = true;
        placedMines++;
      }
    }

    // Compute neighbor mine counts
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          // Loop around neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (newBoard[nr][nc].isMine) count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
  };

  useEffect(() => {
    initBoard();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Ticking effect
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimer(t => Math.min(t + 1, 999));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Reveal Cell recursively (DFS)
  const revealCell = (boardState: Cell[][], r: number, c: number) => {
    const queue: [number, number][] = [[r, c]];
    
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const cell = boardState[currR][currC];
      
      if (cell.isRevealed || cell.isFlagged) continue;
      
      cell.isRevealed = true;

      // If cell has no adjacent mines, we reveal all unrevealed neighbors
      if (cell.neighborMines === 0 && !cell.isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const neighbor = boardState[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
  };

  // Flag/Unflag cell
  const handleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameState === 'lost' || gameState === 'won') return;

    playClickSound();

    const cell = board[r][c];
    if (cell.isRevealed) return;

    const newBoard = board.map(row => row.map(cellItem => ({ ...cellItem })));
    const targetCell = newBoard[r][c];

    if (targetCell.isFlagged) {
      targetCell.isFlagged = false;
      setMinesLeft(prev => prev + 1);
    } else {
      if (minesLeft > 0) {
        targetCell.isFlagged = true;
        setMinesLeft(prev => prev - 1);
      }
    }
    
    setBoard(newBoard);
    
    // Start play on first flag
    if (gameState === 'idle') {
      setGameState('playing');
    }
  };

  // Handle cell click (revealing standard)
  const handleClick = (r: number, c: number) => {
    if (gameState === 'lost' || gameState === 'won') return;

    // Mobile flag toggler override
    if (isMobileFlagging) {
      handleFlag(r, c);
      return;
    }

    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    const newBoard = board.map(row => row.map(cellItem => ({ ...cellItem })));
    const targetCell = newBoard[r][c];

    // Trigger state change
    let currentGameState = gameState;
    if (gameState === 'idle') {
      currentGameState = 'playing';
      setGameState('playing');
    }

    playClickSound();

    // Hit a mine -> Game Over!
    if (targetCell.isMine) {
      // Reveal all mines
      newBoard.forEach(row => {
        row.forEach(item => {
          if (item.isMine) item.isRevealed = true;
        });
      });
      targetCell.isRevealed = true;
      setGameState('lost');
      playErrorSound();
      setBoard(newBoard);
      return;
    }

    // Reveal standard
    revealCell(newBoard, r, c);

    // Double check if player won
    let unrevealedSafeCells = 0;
    newBoard.forEach(row => {
      row.forEach(item => {
        if (!item.isRevealed && !item.isMine) {
          unrevealedSafeCells++;
        }
      });
    });

    if (unrevealedSafeCells === 0) {
      setGameState('won');
      playBubbleSound();
      // Flag all remaining mines
      newBoard.forEach(row => {
        row.forEach(item => {
          if (item.isMine) item.isFlagged = true;
        });
      });
      setMinesLeft(0);
    }

    setBoard(newBoard);
  };

  return (
    <div className="flex flex-col items-center justify-between p-4 bg-[#d4d0c8] select-none text-black h-full font-serif" id="minesweeper-root">
      {/* Group Box Board Header */}
      <div className="w-full flex justify-between items-center mb-3 bg-zinc-200 p-2 border border-white border-t-zinc-600 border-l-zinc-600 rounded-sm" id="minesweeper-header-box">
        <div className="flex items-center gap-1.5 font-sans">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-bold text-zinc-700 font-mono tracking-tight uppercase">Minesweeper Alpha</span>
        </div>
        <button
          onClick={initBoard}
          className="px-2 py-1 bg-[#d4d0c8] text-xs font-mono font-bold font-sans flex items-center gap-1 border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white rounded shadow-sm hover:bg-zinc-100"
        >
          <RotateCcw className="w-3.5 h-3.5" /> RESTART
        </button>
      </div>

      {/* Main retro beveled play console container */}
      <div className="border-[3px] border-[#f0f0f0] border-r-[#808080] border-b-[#808080] bg-[#d4d0c8] p-3 shadow-md" id="sweeper-metallic-console">
        {/* Scoreboard display panel */}
        <div className="border-[2px] border-[#808080] border-r-white border-b-white bg-[#d4d0c8] px-3 py-1.5 flex items-center justify-between mb-3" id="sweeper-scoreboard">
          {/* Bombs left indicator */}
          <div className="bg-black text-[#ff0000] px-2 py-0.5 font-mono text-xl font-bold min-w-[50px] text-center tracking-widest rounded shadow-inner select-all border border-zinc-700">
            {minesLeft.toString().padStart(3, '0')}
          </div>

          {/* Smiley expression clicker */}
          <button 
            onClick={initBoard}
            className="w-9 h-9 border-2 border-white border-r-[#808080] border-b-[#808080] bg-[#d4d0c8] rounded flex items-center justify-center hover:brightness-105 active:border-2 active:border-[#808080] active:border-r-white active:border-b-white shadow-sm"
            id="xp-smile-button"
          >
            {gameState === 'won' ? (
              <span className="text-xl">😎</span>
            ) : gameState === 'lost' ? (
              <span className="text-xl">😵</span>
            ) : gameState === 'playing' ? (
              <span className="text-xl">😮</span>
            ) : (
              <span className="text-xl">🙂</span>
            )}
          </button>

          {/* Timer element */}
          <div className="bg-black text-[#ff0000] px-2 py-0.5 font-mono text-xl font-bold min-w-[50px] text-center tracking-widest rounded shadow-inner border border-zinc-700">
            {timer.toString().padStart(3, '0')}
          </div>
        </div>

        {/* Board Cells Grid Frame */}
        <div className="border-[3px] border-[#808080] border-r-white border-b-white bg-[#808080]" id="sweeper-cells-matrix">
          <div className="grid grid-cols-9 gap-[1.5px] p-[1.5px]">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                let cellStyle = "w-7 h-7 flex items-center justify-center font-extrabold text-sm transition-all focus:outline-none ";
                let content: React.ReactNode = "";

                if (cell.isRevealed) {
                  cellStyle += "bg-zinc-200 border border-zinc-300 shadow-inner ";
                  if (cell.isMine) {
                    content = (
                      <span className="text-red-600 animate-pulse text-xs relative">
                        💣
                      </span>
                    );
                    cellStyle += "bg-red-400 ";
                  } else if (cell.neighborMines > 0) {
                    content = cell.neighborMines.toString();
                    const colors = [
                      'text-blue-700', // 1
                      'text-emerald-700', // 2
                      'text-red-600', // 3
                      'text-indigo-900', // 4
                      'text-red-955', // 5
                      'text-teal-600', // 6
                      'text-black', // 7
                      'text-zinc-500' // 8
                    ];
                    cellStyle += colors[cell.neighborMines - 1];
                  }
                } else {
                  // Unrevealed state with elegant 3D bevels
                  cellStyle += "bg-[#d4d0c8] border-2 border-white border-r-[#808080] border-b-[#808080] active:border-0 hover:brightness-105 active:bg-[#c0c0c0] ";
                  
                  if (cell.isFlagged) {
                    content = <Flag className="w-3.5 h-3.5 text-red-600" fill="red" />;
                  }
                }

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleClick(cell.r, cell.c)}
                    onContextMenu={(e) => handleFlag(cell.r, cell.c, e)}
                    className={cellStyle}
                    style={{ fontFamily: 'monospace' }}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Flag trigger toggle primarily for mobile users */}
      <div className="flex md:hidden items-center gap-1.5 mt-3 px-3 py-1 bg-zinc-200 border border-zinc-400 rounded-sm font-sans" id="mobile-flag-panel">
        <button
          onClick={() => {
            playClickSound();
            setIsMobileFlagging(!isMobileFlagging);
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm border flex items-center gap-1.5 ${
            isMobileFlagging 
            ? 'bg-zinc-800 text-white border-black' 
            : 'bg-zinc-100 text-black border-zinc-400 hover:bg-zinc-50'
          }`}
        >
          <Flag className="w-3.5 h-3.5 text-red-600" />
          {isMobileFlagging ? 'FLAGGING ON' : 'TAP TO FLAG'}
        </button>
      </div>

      {/* Guide label */}
      <div className="hidden md:block text-[10px] text-zinc-500 font-serif leading-none mt-2">
        💡 Right-click inside a tile cell to plant a hazard flag!
      </div>
    </div>
  );
}
