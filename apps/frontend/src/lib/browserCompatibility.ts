export interface BrowserCapabilities {
  audioContext: boolean;
  mediaDevices: boolean;
  speechRecognition: boolean;
  mediaRecorder: boolean;
  webAudio: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
  browserVersion: string;
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    return {
      audioContext: false,
      mediaDevices: false,
      speechRecognition: false,
      mediaRecorder: false,
      webAudio: false,
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      browserName: 'unknown',
      browserVersion: 'unknown',
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();

  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  let browserName = 'unknown';
  let browserVersion = 'unknown';

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    browserName = 'chrome';
    const match = userAgent.match(/chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browserName = 'safari';
    const match = userAgent.match(/version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('firefox')) {
    browserName = 'firefox';
    const match = userAgent.match(/firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('edg')) {
    browserName = 'edge';
    const match = userAgent.match(/edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  return {
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    mediaRecorder: 'MediaRecorder' in window,
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    isMobile,
    isIOS,
    isAndroid,
    browserName,
    browserVersion,
  };
}

export function checkAudioPermissions(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return Promise.resolve(false);
  }

  return navigator.permissions
    .query({ name: 'microphone' as PermissionName })
    .then((result) => result.state === 'granted')
    .catch(() => false);
}

export async function requestAudioPermissions(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    console.error('Failed to get audio permissions:', error);
    return null;
  }
}

export function getOptimalAudioConstraints(
  capabilities: BrowserCapabilities
): MediaStreamConstraints {
  const defaultAudio = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  if (capabilities.isIOS) {
    return {
      audio: {
        ...defaultAudio,
        sampleRate: 16000,
        channelCount: 1,
      },
    };
  }

  if (capabilities.isAndroid) {
    return {
      audio: {
        ...defaultAudio,
        sampleRate: 16000,
        channelCount: 1,
      },
    };
  }

  return {
    audio: {
      ...defaultAudio,
      sampleRate: { ideal: 16000 },
      channelCount: { ideal: 1 },
    },
  };
}

export function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm';
}

export function isBrowserSupported(): { supported: boolean; reason?: string } {
  const capabilities = detectBrowserCapabilities();

  if (!capabilities.audioContext) {
    return { supported: false, reason: 'AudioContext not supported' };
  }

  if (!capabilities.mediaDevices) {
    return { supported: false, reason: 'MediaDevices API not supported' };
  }

  if (!capabilities.mediaRecorder) {
    return { supported: false, reason: 'MediaRecorder API not supported' };
  }

  if (capabilities.isIOS && parseInt(capabilities.browserVersion) < 14) {
    return { supported: false, reason: 'iOS 14+ required' };
  }

  return { supported: true };
}
