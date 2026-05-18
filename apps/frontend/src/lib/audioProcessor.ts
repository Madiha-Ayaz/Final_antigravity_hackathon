export class AudioProcessor {
  private audioContext: AudioContext | null = null;

  constructor(sampleRate: number = 16000) {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate });
    }
  }

  async applyNoiseSuppression(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const filter = offlineContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    source.connect(filter);
    filter.connect(compressor);
    compressor.connect(offlineContext.destination);

    source.start(0);

    return await offlineContext.startRendering();
  }

  async normalizeAudio(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const channelData = audioBuffer.getChannelData(0);
    let max = 0;

    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > max) {
        max = abs;
      }
    }

    if (max === 0) {
      return audioBuffer;
    }

    const normalizedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] / max;
      }
    }

    return normalizedBuffer;
  }

  async convertBlobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const arrayBuffer = await blob.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = new Float32Array(audioBuffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    const volume = 0.8;
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff * volume, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  calculateRMS(audioBuffer: AudioBuffer): number {
    const channelData = audioBuffer.getChannelData(0);
    let sum = 0;

    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }

    return Math.sqrt(sum / channelData.length);
  }

  detectSilence(audioBuffer: AudioBuffer, threshold: number = 0.01): boolean {
    const rms = this.calculateRMS(audioBuffer);
    return rms < threshold;
  }

  close() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioProcessor = new AudioProcessor();
