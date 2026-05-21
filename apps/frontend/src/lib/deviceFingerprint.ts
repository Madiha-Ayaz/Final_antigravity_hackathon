/**
 * Enhanced device fingerprinting utility
 * Generates a unique fingerprint based on browser and device characteristics
 */

interface FingerprintData {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  timezoneOffset: number;
  canvas?: string;
  webgl?: string;
  audioContext?: string;
  fonts?: string[];
  plugins?: string[];
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport: boolean;
  cookieEnabled: boolean;
}

class DeviceFingerprint {
  /**
   * Generate comprehensive device fingerprint
   */
  async generate(): Promise<string> {
    const data = await this.collectFingerprintData();
    const fingerprint = await this.hashFingerprint(data);
    return fingerprint;
  }

  /**
   * Collect all fingerprint data
   */
  private async collectFingerprintData(): Promise<FingerprintData> {
    const data: FingerprintData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      touchSupport: this.getTouchSupport(),
      cookieEnabled: navigator.cookieEnabled,
    };

    // Add hardware info if available
    if ('hardwareConcurrency' in navigator) {
      data.hardwareConcurrency = (navigator as any).hardwareConcurrency;
    }

    if ('deviceMemory' in navigator) {
      data.deviceMemory = (navigator as any).deviceMemory;
    }

    // Add canvas fingerprint
    try {
      data.canvas = await this.getCanvasFingerprint();
    } catch (error) {
      console.warn('Canvas fingerprint failed:', error);
    }

    // Add WebGL fingerprint
    try {
      data.webgl = this.getWebGLFingerprint();
    } catch (error) {
      console.warn('WebGL fingerprint failed:', error);
    }

    // Add audio context fingerprint
    try {
      data.audioContext = await this.getAudioFingerprint();
    } catch (error) {
      console.warn('Audio fingerprint failed:', error);
    }

    // Add fonts
    try {
      data.fonts = await this.getAvailableFonts();
    } catch (error) {
      console.warn('Font detection failed:', error);
    }

    // Add plugins
    try {
      data.plugins = this.getPlugins();
    } catch (error) {
      console.warn('Plugin detection failed:', error);
    }

    return data;
  }

  /**
   * Get canvas fingerprint
   */
  private async getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SilentSiren 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Fingerprint', 4, 17);

    return canvas.toDataURL();
  }

  /**
   * Get WebGL fingerprint
   */
  private getWebGLFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      return '';
    }

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return '';
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  }

  /**
   * Get audio context fingerprint
   */
  private async getAudioFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          resolve('');
          return;
        }

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0; // Mute
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        scriptProcessor.onaudioprocess = (event) => {
          const output = event.outputBuffer.getChannelData(0);
          const fingerprint = Array.from(output.slice(0, 30))
            .map((v) => v.toFixed(10))
            .join(',');

          oscillator.stop();
          context.close();
          resolve(fingerprint);
        };

        oscillator.start(0);
      } catch (error) {
        resolve('');
      }
    });
  }

  /**
   * Detect available fonts
   */
  private async getAvailableFonts(): Promise<string[]> {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial',
      'Verdana',
      'Times New Roman',
      'Courier New',
      'Georgia',
      'Palatino',
      'Garamond',
      'Comic Sans MS',
      'Trebuchet MS',
      'Impact',
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return [];
    }

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const baseFontWidths: Record<string, number> = {};

    // Measure base fonts
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} ${baseFont}`;
      baseFontWidths[baseFont] = ctx.measureText(testString).width;
    }

    const availableFonts: string[] = [];

    // Test each font
    for (const testFont of testFonts) {
      let detected = false;

      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} '${testFont}', ${baseFont}`;
        const width = ctx.measureText(testString).width;

        if (width !== baseFontWidths[baseFont]) {
          detected = true;
          break;
        }
      }

      if (detected) {
        availableFonts.push(testFont);
      }
    }

    return availableFonts;
  }

  /**
   * Get browser plugins
   */
  private getPlugins(): string[] {
    if (!navigator.plugins || navigator.plugins.length === 0) {
      return [];
    }

    return Array.from(navigator.plugins)
      .map((plugin) => plugin.name)
      .sort();
  }

  /**
   * Detect touch support
   */
  private getTouchSupport(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Hash fingerprint data
   */
  private async hashFingerprint(data: FingerprintData): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  /**
   * Get simplified fingerprint (for display)
   */
  getSimplifiedFingerprint(): string {
    const data = {
      ua: navigator.userAgent.substring(0, 50),
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      lang: navigator.language,
    };

    return btoa(JSON.stringify(data)).substring(0, 16);
  }
}

export const deviceFingerprint = new DeviceFingerprint();
