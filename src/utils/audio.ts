// Safely handle AudioContext for different browsers
let audioCtx: AudioContext | null = null;
let isMuted = false;
let bgmSequencerInterval: number | null = null;

function getAudioContext() {
  if (isMuted) return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    stopBgm();
  }
  return isMuted;
}

export function getMuteState() {
  return isMuted;
}

// Windows XP Startup Chord
export function playStartupSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // XP Chord Structure roughly is Ab Major / Db Major 9th
  const notes = [110.0, 138.6, 207.7, 277.2, 311.1, 415.3, 466.2, 523.3, 622.3]; // Hz
  
  // Sweep filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(100, now);
  filter.frequency.exponentialRampToValueAtTime(3000, now + 1.2);
  filter.Q.setValueAtTime(1, now);
  filter.connect(ctx.destination);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
  masterGain.gain.setValueAtTime(0.25, now + 2.0);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
  masterGain.connect(filter);

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // Mix triangle and sine to get that soft glass synth pad feel
    osc.type = idx < 3 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    // Delay higher notes slightly for the beautiful upward roll
    const delay = idx * 0.08;
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.setValueAtTime(0, now + delay);
    oscGain.gain.linearRampToValueAtTime(idx < 3 ? 0.2 : 0.1, now + delay + 0.6);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0 + delay);
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 4.5 + delay);
  });
}

// Windows XP Shutdown Chord
export function playShutdownSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.3, 415.3, 311.1, 207.7, 138.6]; // Descending C5 -> Ab4 -> Eb4 -> Ab3 -> Db3

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.2, now);
  masterGain.gain.linearRampToValueAtTime(0.2, now + 1.0);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  masterGain.connect(ctx.destination);

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    const delay = idx * 0.12;
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.setValueAtTime(0, now + delay);
    oscGain.gain.linearRampToValueAtTime(0.12, now + delay + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + delay);
    
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 2.5);
  });
}

// Windows XP Critical Error Sound (The standard Metallic Clank)
export function playErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  gainNode.connect(ctx.destination);

  // Deep metallic clank uses raw harmonics (close frequencies)
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(145, now); // Low punch

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(148, now); // Beating effect

  const osc3 = ctx.createOscillator();
  osc3.type = 'sawtooth';
  osc3.frequency.setValueAtTime(320, now); // High harshness
  
  const osc3Gain = ctx.createGain();
  osc3Gain.gain.setValueAtTime(0.05, now);
  osc3Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, now);

  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(osc3Gain);
  osc3Gain.connect(filter);
  
  filter.connect(gainNode);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);
  osc3.stop(now + 0.5);
}

// Windows XP Navigation Sound (Standard start.wav click)
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.Q.setValueAtTime(5, now);
  filter.connect(ctx.destination);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.08, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  gainNode.connect(filter);

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
  
  osc.connect(gainNode);
  osc.start(now);
  osc.stop(now + 0.06);
}

// Windows Bubble / Balloon Tooltip Chord (Soft popup sound)
export function playBubbleSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [659.3, 880.0, 1046.5]; // E5, A5, C6 arpeggio

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(0, now + idx * 0.06);
    gainNode.gain.linearRampToValueAtTime(0.06, now + idx * 0.06 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
  });
}

// Procedural Retro bgm sequencer (Classic 2004 Keygen Music - cute squarewave tracker beat)
export function playBgm() {
  if (bgmSequencerInterval) return; // Already running
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  let step = 0;
  // Nostalgic chiptune progression in A minor (A, F, C, G)
  const progressions = [
    [440.0, 523.3, 659.3, 784.0], // Am7
    [349.2, 440.0, 523.3, 659.3], // Fmaj7
    [523.3, 659.3, 784.0, 987.8], // Cmaj7
    [392.0, 493.9, 587.3, 698.5], // G7
  ];
  
  bgmSequencerInterval = window.setInterval(() => {
    const activeCtx = getAudioContext();
    if (!activeCtx || activeCtx.state === 'suspended') return;
    
    const now = activeCtx.currentTime;
    const progIndex = Math.floor(step / 16) % progressions.length;
    const notes = progressions[progIndex];
    
    const scaleStep = step % 16;
    
    // Play a bass note on 1st, 5th, 9th, 13th steps
    if (scaleStep % 4 === 0) {
      const bassOsc = activeCtx.createOscillator();
      const bassGain = activeCtx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(notes[0] / 4, now); // Two octaves down
      
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      bassOsc.connect(bassGain);
      bassGain.connect(activeCtx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.32);
    }
    
    // Arpeggiator / Melody notes
    let playMelody = false;
    let melodyNote = notes[step % 4];
    
    // Some patterns
    if (scaleStep % 2 === 0 || scaleStep === 3 || scaleStep === 7 || scaleStep === 11 || scaleStep === 15) {
      playMelody = true;
      if (scaleStep === 7 || scaleStep === 15) {
        melodyNote = notes[3] * 1.5; // High sparkle!
      }
    }
    
    if (playMelody) {
      const melOsc = activeCtx.createOscillator();
      const melGain = activeCtx.createGain();
      melOsc.type = 'square'; // Classic retro sound
      melOsc.frequency.setValueAtTime(melodyNote, now);
      
      melGain.gain.setValueAtTime(0.015, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      // Retro echo
      const delay = activeCtx.createDelay();
      delay.delayTime.setValueAtTime(0.12, now);
      const delayGain = activeCtx.createGain();
      delayGain.gain.setValueAtTime(0.4, now);
      
      melOsc.connect(melGain);
      melGain.connect(activeCtx.destination);
      
      // Echo cycle
      melGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(activeCtx.destination);
      
      melOsc.start(now);
      melOsc.stop(now + 0.18);
    }
    
    step++;
  }, 140); // 107 BPM 16th notes approx
}

export function stopBgm() {
  if (bgmSequencerInterval) {
    clearInterval(bgmSequencerInterval);
    bgmSequencerInterval = null;
  }
}
