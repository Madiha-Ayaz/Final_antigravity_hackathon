/**
 * Siren Sound Generator and Player
 * Creates emergency siren sound and plays it
 */

export class SirenService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Play emergency siren sound
   */
  playSiren(): void {
    if (!this.audioContext || this.isPlaying) return;

    try {
      // Create oscillator for siren sound
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Configure siren sound (alternating frequencies)
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);

      // Create alternating siren effect
      const now = this.audioContext.currentTime;
      for (let i = 0; i < 10; i++) {
        const time = now + i * 0.5;
        this.oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 1000, time);
      }

      // Set volume
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

      // Start playing
      this.oscillator.start();
      this.isPlaying = true;

      // Auto-stop after 5 seconds
      setTimeout(() => {
        this.stopSiren();
      }, 5000);

      console.log('🚨 Siren started playing');
    } catch (error) {
      console.error('Failed to play siren:', error);
    }
  }

  /**
   * Stop siren sound
   */
  stopSiren(): void {
    if (this.oscillator && this.isPlaying) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.gainNode?.disconnect();
        this.isPlaying = false;
        console.log('🔇 Siren stopped');
      } catch (error) {
        console.error('Failed to stop siren:', error);
      }
    }
  }

  /**
   * Play alert beep sound
   */
  playBeep(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.2);

      console.log('🔔 Beep played');
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }

  /**
   * Check if siren is currently playing
   */
  isSirenPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Test siren (plays for 2 seconds)
   */
  testSiren(): void {
    this.playSiren();
    setTimeout(() => {
      this.stopSiren();
    }, 2000);
  }
}

export const sirenService = new SirenService();
