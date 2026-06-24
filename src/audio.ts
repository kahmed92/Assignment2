/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private musicInterval: any = null;
  private currentStep: number = 0;
  private mainVolumeNode: GainNode | null = null;
  private musicVolumeNode: GainNode | null = null;

  // Pentatonic scale notes (A Minor Pentatonic: A2 to A4)
  // [A2, C3, D3, E3, G3, A3, C4, D4, E4, G4, A4]
  private scale: number[] = [
    110.00, // A2
    130.81, // C3
    146.83, // D3
    164.81, // E3
    196.00, // G3
    220.00, // A3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
  ];

  // An arpeggio/bassline scheme that feels like 80s Cyberpunk synthwave
  private bassPattern: number[] = [0, 3, 2, 5, 0, 3, 2, 7, 0, 4, 3, 5, 0, 3, 5, 8];
  private leadPattern: number[] = [
    -1, 5, 7, 8, -1, 7, 8, 10,
    -1, 8, 7, 5, 10, 8, 7, 5
  ];

  constructor() {
    // Lazy initialized on first interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new AudioContextClass();

      this.mainVolumeNode = this.ctx.createGain();
      this.mainVolumeNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.mainVolumeNode.connect(this.ctx.destination);

      this.musicVolumeNode = this.ctx.createGain();
      this.musicVolumeNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.musicVolumeNode.connect(this.mainVolumeNode);
    } catch (e) {
      console.warn("Web Audio API not supported in this browser.", e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (enabled && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public isMusicEnabled() {
    return this.musicEnabled;
  }

  public resumeContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  public playClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.mainVolumeNode);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playEatRegular() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Friendly upwards chirp
    osc.frequency.setValueAtTime(330, t); // E4
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.08); // E5

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.mainVolumeNode);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playEatGolden() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    // Golden reward chime: fast, double bright note
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.mainVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + delay + 0.1);

      gain.gain.setValueAtTime(0.15, t + delay);
      gain.gain.linearRampToValueAtTime(0.01, t + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.mainVolumeNode);

      osc.start(t + delay);
      osc.stop(t + delay + 0.2);
    });
  }

  public playEatCrystal() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    // Laser-like cyber crystal shimmer
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.linearRampToValueAtTime(1760, t + 0.15);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, t);
    osc2.frequency.linearRampToValueAtTime(110, t + 0.15);

    gain1.gain.setValueAtTime(0.08, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.mainVolumeNode);

    osc2.connect(gain2);
    gain2.connect(this.mainVolumeNode);

    osc1.start(t);
    osc1.stop(t + 0.16);

    osc2.start(t);
    osc2.stop(t + 0.16);
  }

  public playLevelUp() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    // Triumph level up fanfare
    const t = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const dur = 0.12;

    melody.forEach((freq, idx) => {
      if (!this.ctx || !this.mainVolumeNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startAt = t + idx * 0.1;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startAt);

      gain.gain.setValueAtTime(0.12, startAt);
      gain.gain.exponentialRampToValueAtTime(0.01, startAt + dur * 1.5);

      osc.connect(gain);
      gain.connect(this.mainVolumeNode);

      osc.start(startAt);
      osc.stop(startAt + dur * 2);
    });
  }

  public playGameOver() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.mainVolumeNode) return;

    // Sad declining dark synth sweep
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.8);

    // Apply lowpass filter for subby crash sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.linearRampToValueAtTime(150, t + 0.8);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mainVolumeNode);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  // --- Background Synthesizer Music Sequencer ---

  private startMusic() {
    this.initContext();
    if (!this.ctx || !this.musicEnabled) return;

    // Make sure we are active
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.musicInterval) {
      clearInterval(this.musicInterval);
    }

    this.currentStep = 0;
    const secondsPerBeat = 0.15; // Fast pacing Cyberpunk feeling

    this.musicInterval = setInterval(() => {
      this.playMusicStep();
    }, secondsPerBeat * 1000);
  }

  private stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playMusicStep() {
    if (!this.ctx || this.ctx.state === 'suspended' || !this.musicEnabled || !this.musicVolumeNode) return;

    const t = this.ctx.currentTime;

    // BASS ENGINE (always plays a steady grid)
    const bassIdx = this.bassPattern[this.currentStep % this.bassPattern.length];
    const bassFreq = this.scale[bassIdx % 4]; // low octave
    
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassFreq, t);

    // Clean low-pass filter to keep bass warm and not harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    // Dynamic gate envelope
    bassGain.gain.setValueAtTime(0.08, t);
    bassGain.gain.linearRampToValueAtTime(0.01, t + 0.12);

    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.musicVolumeNode);

    bassOsc.start(t);
    bassOsc.stop(t + 0.14);

    // MELODY LEAD ENGINE (plays occasionally in key sync)
    const leadIdx = this.leadPattern[this.currentStep % this.leadPattern.length];
    if (leadIdx !== -1 && (this.currentStep % 2 === 0)) {
      const melodyFreq = this.scale[leadIdx % this.scale.length];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(melodyFreq, t);

      leadGain.gain.setValueAtTime(0.04, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicVolumeNode);

      leadOsc.start(t);
      leadOsc.stop(t + 0.3);
    }

    // Progress the beat
    this.currentStep = (this.currentStep + 1) % 16;
  }
}

export const snakeAudio = new AudioEngine();
