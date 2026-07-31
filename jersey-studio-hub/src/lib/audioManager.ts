// Luxury Live Auction Countdown Synthesis Engine (HTML5 Web Audio API)
// Provides clean, real-time synthesized ticking and heartbeat sounds indicating live bidding suspense without any external asset dependency.

class LiveAuctionAudioEngine {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isMutedState: boolean = true;

  constructor() {
    // Lazy loaded context
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMutedState = muted;
    if (!muted) {
      this.initContext();
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  public get isMuted() {
    return this.isMutedState;
  }

  private startLoop() {
    if (this.intervalId) return;
    this.initContext();

    let beatCount = 0;

    // Pulse loops every 1.0 second
    this.intervalId = setInterval(() => {
      if (this.isMutedState || !this.ctx) return;

      try {
        const time = this.ctx.currentTime;

        // Play standard low heartbeat double pulse (lub-dub)
        this.playHeartbeat(time, 55, 0.15); // Lub: 55Hz, 150ms length
        this.playHeartbeat(time + 0.25, 50, 0.12); // Dub: 50Hz, 120ms length

        // Play dramatic mechanical clock ticks (every 500ms / half beat)
        this.playTick(time + 0.5, 1800, 0.04); // high tick
        this.playTick(time + 1.0, 1600, 0.04); // low tick
        
      } catch (err) {
        console.warn("[AUDIO ENGINE PULSE ERROR]:", err);
      }

      beatCount++;
    }, 1000);
  }

  private stopLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playHeartbeat(startTime: number, hz: number, duration: number) {
    if (!this.ctx) return;
    
    // Heartbeat: deep low sine wave
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, startTime);
    // Smooth pitch sweep down
    osc.frequency.exponentialRampToValueAtTime(hz * 0.7, startTime + duration);

    gainNode.gain.setValueAtTime(0.0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02); // quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // smooth decay

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private playTick(startTime: number, hz: number, duration: number) {
    if (!this.ctx) return;

    // Clock Tick: short high-pass frequency envelope
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, startTime);

    gainNode.gain.setValueAtTime(0.0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.002); // instant click
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // ultra fast decay

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  public shutdown() {
    this.stopLoop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const liveBiddingAudioEngine = new LiveAuctionAudioEngine();
