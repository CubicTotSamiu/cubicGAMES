import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, Heart, Send, Ghost } from 'lucide-react';
import { playClickSound, playBubbleSound } from '../utils/audio';
import { GuestbookEntry } from '../types';

export default function InternetExplorerView() {
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [userName, setUserName] = useState('');
  const [userMsg, setUserMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'guestbook' | 'websearch'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string[]>([]);

  // Load initial guestbook from localStorage or fallbacks
  useEffect(() => {
    const saved = localStorage.getItem('cubic_guestbook');
    if (saved) {
      setGuestbook(JSON.parse(saved));
    } else {
      const defaultLogs: GuestbookEntry[] = [
        { name: 'retro_gamer_99', message: 'rawrr i love this tetris falling block game!! so nostalgic XD', date: 'Oct 14, 2004' },
        { name: 'cubicFan04', message: 'Anyone remember playing games under DOS / Win95? This pixel paint tool brings back so many memories!', date: 'Nov 02, 2004' },
        { name: 'XP_Lord', message: 'Unbelievably cozy website! The XP Bliss hills background and system chiming makes me want to dual boot my tower again.', date: 'Dec 25, 2004' }
      ];
      setGuestbook(defaultLogs);
      localStorage.setItem('cubic_guestbook', JSON.stringify(defaultLogs));
    }
  }, []);

  const handleSignGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userMsg.trim()) return;

    playBubbleSound();
    
    const newEntry: GuestbookEntry = {
      name: userName,
      message: userMsg,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newEntry, ...guestbook];
    setGuestbook(updated);
    localStorage.setItem('cubic_guestbook', JSON.stringify(updated));
    setUserName('');
    setUserMsg('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!searchQuery) return;

    // Direct retro easter eggs search matches
    const queries = searchQuery.toLowerCase();
    if (queries.includes('cubic') || queries.includes('games')) {
      setSearchResult([
        'Cubic Games Official Release Note: 15 arcade titles shipped on compact CD-rom in 2004.',
        'Cubic Blocks Matrix Core: An addictive physical puzzle matching grid cubes.',
        'Minesweeper helper core: Secret cheat coordinates can be uncovered by entering codes on DOS prompt!'
      ]);
    } else if (queries.includes('xp') || queries.includes('windows')) {
      setSearchResult([
        'Windows XP Operating System first introduced Bliss wallpaper landscape in late 2001.',
        'Internet Explorer v6.0 declared world-dominant browser with 85% consumer footprint.'
      ]);
    } else {
      setSearchResult([
        `No matches found for "${searchQuery}". Try searching for categories like "cubic", "games", or "XP"!`
      ]);
    }
  };

  return (
    <div className="flex flex-col bg-[#d4d0c8] select-none text-black h-full font-sans text-xs" id="ie6-panel-wrapper">
      
      {/* IE Toolbar header bevel panel */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-400 p-1.5 bg-[#d4d0c8]" id="ie6-navigation-bar">
        {/* Row 1: Back/Forward buttons */}
        <div className="flex items-center gap-1.5" id="ie-nav-actions">
          <button 
            onClick={() => { playClickSound(); setActiveTab('home'); }}
            className="flex items-center gap-1 hover:bg-zinc-200 border border-transparent hover:border-white hover:border-r-zinc-650 hover:border-b-zinc-650 px-2 py-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-[10.5px]">Back</span>
          </button>
          
          <button 
            onClick={() => { playClickSound(); }}
            className="flex items-center gap-1 opacity-50 cursor-normal px-2 py-0.5"
            disabled
          >
            <ArrowRight className="w-4 h-4 text-zinc-500" />
            <span className="text-[10.5px]">Forward</span>
          </button>

          <button 
            onClick={() => { playClickSound(); }}
            className="flex hover:bg-zinc-200 border border-transparent hover:border-white px-1.5 py-0.5 ml-1"
          >
            <RotateCw className="w-3.5 h-3.5 text-zinc-600" />
          </button>

          <button 
            onClick={() => { playClickSound(); setActiveTab('home'); }}
            className="flex items-center gap-1 hover:bg-zinc-200 border border-transparent hover:border-white px-2 py-0.5"
          >
            <Home className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-[10.5px]">Home</span>
          </button>

          <span className="h-4 w-[1px] bg-zinc-400 mx-1" />

          {/* Tab selectors within IE */}
          <div className="flex gap-1" id="ie-tabs-row">
            <button
              onClick={() => { playClickSound(); setActiveTab('home'); }}
              className={`px-3 py-1 text-[10px] font-bold border ${
                activeTab === 'home' 
                  ? 'bg-white border-zinc-400 border-b-white z-10' 
                  : 'bg-zinc-200 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              CubicGames Central
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('guestbook'); }}
              className={`px-3 py-1 text-[10px] font-bold border ${
                activeTab === 'guestbook' 
                  ? 'bg-white border-zinc-400 border-b-white z-10' 
                  : 'bg-zinc-200 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
               ✍ Sign Guestbook
            </button>
            <button
              onClick={() => { playClickSound(); setActiveTab('websearch'); }}
              className={`px-3 py-1 text-[10px] font-bold border ${
                activeTab === 'websearch' 
                  ? 'bg-white border-zinc-400 border-b-white z-10' 
                  : 'bg-zinc-200 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              🔍 WebSearch 2004
            </button>
          </div>
        </div>

        {/* Row 2: URL Address Input */}
        <div className="flex items-center gap-2 mt-1 select-none" id="ie-address-field-wrap">
          <label className="text-zinc-650 text-[10px] select-none font-sans font-semibold pl-1.5">Address</label>
          <div className="flex-1 flex bg-white border border-zinc-400 border-t-zinc-600 border-l-zinc-600 px-1.5 py-0.5 text-zinc-800 font-mono text-[10.5px]">
            <span className="text-zinc-400 select-all font-sans mr-1">http://</span>
            <span className="font-sans font-semibold text-zinc-800">cubic.games/retro/portal.html</span>
          </div>
          <button 
            className="bg-[#d4d0c8] py-0.5 px-3 font-semibold border border-white border-r-zinc-600 border-b-zinc-600 active:border-r-white active:border-b-white rounded shadow-sm text-[10px]"
            onClick={() => playClickSound()}
          >
            Go
          </button>
        </div>
      </div>

      {/* Main Browser Canvas frame */}
      <div className="flex-1 bg-white overflow-y-auto" id="ie-web-iframe-viewport">
        {/* Animated marquee header across the portal page */}
        <div className="bg-[#ffeb3b] border-b border-[#efd621] py-1 px-3 text-amber-950 font-bold tracking-tight text-[10px] flex items-center justify-between shadow-sm">
          <div className="overflow-hidden w-full relative h-4">
            <div className="absolute whitespace-nowrap animate-marquee left-0">
              ⚡✶ WELCOME BACK TO THE YEAR 2004! PLAY RETRO CUBIC GAMES FOR FREE ✶ DRAW MASTERPIECES IN PAINT & SAVE TO DESKTOP ✶ LEAVE AN ENTRY IN OUR GUESTBOOK BELOW! ⚡
            </div>
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="p-4 flex flex-col md:flex-row gap-5" id="ie-web-home">
            {/* Left rail sidebar: badges, hits counter */}
            <div className="md:w-[28%] flex flex-col gap-3 font-sans" id="ie-web-sidebar">
              
              {/* Retro Visitor counter */}
              <div className="border-2 border-dashed border-blue-400 bg-sky-50/50 p-2 text-center rounded">
                <div className="text-[9px] text-blue-800 font-bold uppercase select-none tracking-wider mb-1">YOU ARE VISITOR</div>
                <div className="bg-black text-lime-400 font-mono text-sm px-2 py-1 font-bold tracking-widest border border-zinc-800 rounded select-all shadow-inner">
                  0 4 8 2 9 1 2
                </div>
                <span className="text-[7.5px] text-zinc-400 block mt-1.5 leading-none">Counter started Nov 2003</span>
              </div>

              {/* Classic 2000s Web Badget list */}
              <div className="border border-zinc-300 rounded p-2 flex flex-col gap-1.5 bg-zinc-50" id="retro-badget-box">
                <div className="text-[9px] text-zinc-500 font-extrabold pb-1 border-b uppercase mb-1">Affiliates Badges</div>
                
                {/* Fake high-fidelity 80x15 badges */}
                <div className="flex items-center text-[8px] bg-[#000080] text-white px-1.5 py-0.5 font-mono select-none rounded-[1px] justify-between">
                  <span>IE 6.0</span> <span className="bg-white text-zinc-900 px-1 text-[7px] font-sans font-bold">CERTIFIED</span>
                </div>
                
                <div className="flex items-center text-[8px] bg-[#e31212] text-white px-1.5 py-0.5 font-mono select-none rounded-[1px] justify-between">
                  <span>NETSCAPE</span> <span className="bg-white text-red-650 px-1 text-[7px] font-sans font-bold">WIN</span>
                </div>

                <div className="flex items-center text-[8px] bg-zinc-800 text-yellow-300 px-1.5 py-0.5 font-mono select-none rounded-[1px] justify-between">
                  <span>MADE_IN_2004</span> <span className="bg-amber-500 text-black px-1 text-[7px] font-sans font-bold">OK</span>
                </div>

                <div className="flex items-center text-[8px] bg-amber-600 text-white px-1.5 py-0.5 font-sans select-none rounded-[1px] justify-between">
                  <span>BEST_IN_CRT</span> <span className="bg-zinc-100 text-[#0000a0] px-1 text-[7px] font-bold">1024x768</span>
                </div>
              </div>
            </div>

            {/* Main center column page details */}
            <div className="flex-1 flex flex-col gap-4 text-zinc-800" id="ie-web-body">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-extrabold bg-gradient-to-r from-[#003cb4] to-[#1264df] bg-clip-text text-transparent flex items-center gap-1 leading-none select-none">
                  ✶ CUBIC.GAMES Retro Arcade ✶
                </h1>
                <p className="text-[10px] text-zinc-500 italic mt-0.5">"The finest voxel puzzle solutions and arcade games on early Web, updated daily!"</p>
              </div>

              {/* Welcome box */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-blue-50/50 p-3.5 border border-emerald-300/40 rounded-sm">
                <h3 className="font-bold text-emerald-800 text-xs mb-1">🎮 Discover Playable Software Built-In!</h3>
                <p className="leading-relaxed text-zinc-600 text-[11px]">
                  Double-click our adorable customized <span className="font-bold text-blue-900">CRT Monitor desktop frames</span> directly or click the <span className="font-bold text-emerald-700">Start Button</span> in the bottom bar to open apps like:
                </p>
                <ul className="list-disc pl-4 mt-2 mb-1 flex flex-col gap-1 text-[10.5px] font-medium text-zinc-700">
                  <li><span className="text-[#bf154b] font-bold">Cubic Blocks</span>: An addictive brick dropping high-score puzzle game!</li>
                  <li><span className="text-emerald-700 font-bold">Minesweeper Alpha</span>: Plant flags and puzzle out standard mines in DOS style!</li>
                  <li><span className="text-blue-700 font-bold">Cubic Paint Pro</span>: Draw anything and save custom drawings to desktop.</li>
                </ul>
              </div>

              {/* Retro bulletin forum */}
              <div className="border border-zinc-200 p-3 rounded" id="bulletin-board">
                <span className="font-bold text-zinc-700 border-b pb-1.5 block mb-2 uppercase text-[9.5px]">📟 Latest Bulletins (June 2004)</span>
                <div className="flex flex-col gap-2" id="bulletin-list">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 block select-all">★ Compact CD-ROM Portal Release v1.04</span>
                    <span className="text-[10.5px] text-zinc-600">The server hard disk has been updated to support standard direct mouse pointers, chiptune ambient soundtracking, and custom save files. All users are encouraged to sign our global Guestbook!</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-750 block select-all">★ Minesweeper Cheatcode Found</span>
                    <span className="text-[10.5px] text-zinc-600">Rumor reaches that writing <code className="font-mono bg-zinc-150 px-1 py-0.5 text-red-600">winver</code> in the Windows Run dialogue unlocks a tribute secret diagnostic dialogue! try compiling it standard.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guestbook' && (
          <div className="p-4" id="ie-web-guestbook">
            <h2 className="text-lg font-bold text-zinc-800 mb-1 flex items-center gap-1 select-none">
              <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" /> Retro Guestbook Posts
            </h2>
            <p className="text-[10.5px] text-zinc-500 mb-4 select-none">Leave your friendly signature, messages, or comments below to save it permanently into cubic.games history!</p>

            {/* Post signature form */}
            <form onSubmit={handleSignGuestbook} className="bg-zinc-50 border border-zinc-300 p-3 rounded flex flex-col gap-2 mb-5" id="guestbook-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Nickname:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neo_Matrix"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-white border border-zinc-400 p-1.5 font-mono text-zinc-850 focus:outline-none focus:border-blue-600 rounded-sm"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] uppercase font-bold text-zinc-500">Msg Date:</label>
                  <input
                    type="text"
                    disabled
                    value="Just Now (Live Sync)"
                    className="bg-zinc-200 border border-zinc-300 p-1.5 font-mono text-zinc-500 cursor-not-allowed rounded-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] uppercase font-bold text-zinc-500">Your Message:</label>
                <textarea
                  required
                  placeholder="Type anything cute, retro, or funny..."
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  className="bg-white border border-zinc-400 p-1.5 font-mono text-zinc-850 h-16 resize-none focus:outline-none focus:border-blue-600 rounded-sm"
                />
              </div>

              <button
                type="submit"
                className="bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold py-1.5 px-4 border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white rounded shadow hover:brightness-105 transition-all text-xs self-start flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Sign Guestbook
              </button>
            </form>

            {/* List postings */}
            <div className="flex flex-col gap-3" id="guestbook-listing">
              {guestbook.map((log, idx) => (
                <div key={idx} className="border border-zinc-200 bg-white/40 p-3 rounded-md shadow-sm" id={`comment-tab-${idx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-blue-800 font-mono text-[11px] flex items-center gap-1">
                      <span className="text-xs">👤</span> {log.name}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {log.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-700 italic font-medium leading-relaxed">"{log.message}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'websearch' && (
          <div className="p-4" id="ie-web-search">
            <div className="max-w-[380px] mx-auto text-center mt-4">
              <h1 className="text-2xl font-serif font-extrabold text-blue-900 tracking-tight leading-none italic mb-1">
                🔎 WebSearch 2004
              </h1>
              <p className="text-[10.5px] text-zinc-500 mb-4 select-none">"Fast retro crawler indexing early gaming portals & DLL libraries"</p>

              {/* Search form */}
              <form onSubmit={handleSearch} className="flex gap-1.5 mb-6" id="search-box-form">
                <input
                  type="text"
                  required
                  placeholder="Search 'cubic' or 'XP' or query anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white border border-zinc-400 p-1.5 text-zinc-800 text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="bg-[#d4d0c8] font-bold py-1.5 px-3 border-2 border-white border-r-zinc-650 border-b-zinc-650 active:border-r-white active:border-b-white rounded shadow-sm text-xs"
                >
                  Search
                </button>
              </form>

              {/* Results */}
              <div className="text-left bg-zinc-50 border border-zinc-200 rounded p-3 minimum-h-[100px]" id="search-results-board">
                {searchResult.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold font-sans">Query results lists:</span>
                    {searchResult.map((res, idy) => (
                      <div key={idy} className="text-xs text-zinc-700 leading-relaxed border-b border-dashed border-zinc-200 pb-1.5 last:border-0">
                        <span className="text-blue-500 font-bold hover:underline select-all text-[11px] block cursor-pointer">
                          🌐 http://index.archive.org/posts/{102 + idy}.html
                        </span>
                        <p className="text-[10.5px] text-zinc-600 mt-0.5">{res}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-zinc-400 gap-1.5 text-center">
                    <Ghost className="w-8 h-8 text-zinc-300 animate-bounce" />
                    <span className="text-[10.5px] tracking-tight">Enter 'cubic' or 'XP' in search bar, then click search button!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
