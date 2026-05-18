# Voice Detection Engine Documentation

## Overview

The Voice Detection Engine provides passive audio monitoring with wake phrase detection for emergency situations. It uses Web Audio API, MediaRecorder API, and Web Speech Recognition to continuously listen for distress signals while maintaining low CPU and battery usage.

## Architecture

### Core Components

1. **Audio Monitor** - Captures and analyzes audio in real-time
2. **Wake Phrase Detector** - Recognizes emergency keywords
3. **Rolling Buffer** - Maintains last 15 seconds of audio
4. **Audio Processor** - Applies noise suppression and normalization

## Hooks

### useAudioMonitor

Manages Web Audio API for passive listening and audio level monitoring.

```typescript
const {
  isListening, // boolean - monitoring status
  isSupported, // boolean - browser support
  error, // string | null - error message
  audioLevel, // number - current audio level (0-100)
  startListening, // () => Promise<void>
  stopListening, // () => void
  getAudioBuffer, // () => Float32Array[]
  clearAudioBuffer, // () => void
} = useAudioMonitor({
  sampleRate: 16000,
  channels: 1,
  bufferDuration: 15,
});
```

**Features:**

- Echo cancellation
- Noise suppression
- Auto gain control
- Real-time audio level monitoring
- Automatic cleanup

### useWakePhraseDetection

Detects emergency wake phrases using Web Speech Recognition.

```typescript
const {
  isDetecting, // boolean - detection status
  lastDetection, // WakePhraseDetection | null
  detectionCount, // number - total detections
  startDetection, // () => void
  stopDetection, // () => void
  resetDetection, // () => void
} = useWakePhraseDetection();
```

**Wake Phrases:**

- "help me"
- "emergency"
- "call police"

**Configuration:**

- Confidence threshold: 70%
- Cooldown period: 2 seconds
- Continuous listening mode

### useRollingAudioBuffer

Maintains a rolling buffer of recent audio for emergency analysis.

```typescript
const {
  startRecording, // (stream: MediaStream) => Promise<void>
  stopRecording, // () => void
  getBufferedAudio, // () => Promise<Blob | null>
  getBufferedAudioAsArrayBuffer, // () => Promise<ArrayBuffer | null>
  clearBuffer, // () => void
  getBufferDuration, // () => number
} = useRollingAudioBuffer({
  maxDuration: 15,
  sampleRate: 16000,
  channels: 1,
});
```

**Features:**

- Circular buffer (15 seconds)
- Automatic chunk management
- Multiple export formats
- Memory efficient

## Audio Processing

### AudioProcessor Class

Provides audio processing utilities for noise suppression and format conversion.

```typescript
import { audioProcessor } from '@/lib/audioProcessor';

// Apply noise suppression
const cleanAudio = await audioProcessor.applyNoiseSuppression(audioBuffer);

// Normalize audio levels
const normalized = await audioProcessor.normalizeAudio(audioBuffer);

// Convert to WAV
const wavBlob = await audioProcessor.audioBufferToWav(audioBuffer);

// Calculate RMS
const rms = audioProcessor.calculateRMS(audioBuffer);

// Detect silence
const isSilent = audioProcessor.detectSilence(audioBuffer, 0.01);
```

**Processing Pipeline:**

1. High-pass filter (200Hz cutoff)
2. Dynamic compression
3. Normalization
4. Format conversion

## Browser Compatibility

### Detection

```typescript
import { detectBrowserCapabilities, isBrowserSupported } from '@/lib/browserCompatibility';

const capabilities = detectBrowserCapabilities();
// Returns: {
//   audioContext: boolean,
//   mediaDevices: boolean,
//   speechRecognition: boolean,
//   mediaRecorder: boolean,
//   webAudio: boolean,
//   isMobile: boolean,
//   isIOS: boolean,
//   isAndroid: boolean,
//   browserName: string,
//   browserVersion: string,
// }

const { supported, reason } = isBrowserSupported();
```

### Supported Browsers

| Browser | Desktop | Mobile | Notes            |
| ------- | ------- | ------ | ---------------- |
| Chrome  | ✅      | ✅     | Full support     |
| Firefox | ✅      | ✅     | Full support     |
| Safari  | ✅      | ✅     | iOS 14+ required |
| Edge    | ✅      | ✅     | Full support     |

### Permission Handling

```typescript
import { checkAudioPermissions, requestAudioPermissions } from '@/lib/browserCompatibility';

// Check current permission status
const hasPermission = await checkAudioPermissions();

// Request microphone access
const stream = await requestAudioPermissions();
```

## Components

### AudioVisualizer

Real-time audio level visualization with animated bars.

```tsx
import { AudioVisualizer } from '@/components';

<AudioVisualizer audioLevel={75} isActive={true} />;
```

### CompatibilityBanner

Displays browser compatibility warnings.

```tsx
import { CompatibilityBanner } from '@/components';

<CompatibilityBanner onDismiss={() => console.log('dismissed')} />;
```

### WakePhraseIndicator

Shows floating notification when wake phrase is detected.

```tsx
import { WakePhraseIndicator } from '@/components';

<WakePhraseIndicator
  phrase="help me"
  confidence={0.85}
  timestamp={new Date()}
  onDismiss={() => {}}
/>;
```

## Complete Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAudioMonitor, useWakePhraseDetection, useRollingAudioBuffer } from '@/hooks';
import { AudioVisualizer, WakePhraseIndicator } from '@/components';

export default function EmergencyMonitor() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const { isListening, audioLevel, startListening, stopListening } = useAudioMonitor();
  const { lastDetection, startDetection, stopDetection } = useWakePhraseDetection();
  const { startRecording, stopRecording, getBufferedAudio } = useRollingAudioBuffer();

  const handleStart = async () => {
    try {
      await startListening();
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      await startRecording(mediaStream);
      startDetection();
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const handleStop = () => {
    stopListening();
    stopDetection();
    stopRecording();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
  };

  useEffect(() => {
    if (lastDetection) {
      // Handle emergency detection
      console.log('Emergency detected:', lastDetection);
    }
  }, [lastDetection]);

  return (
    <div>
      <button onClick={isActive ? handleStop : handleStart}>
        {isActive ? 'Stop' : 'Start'} Monitoring
      </button>

      {isActive && (
        <>
          <AudioVisualizer audioLevel={audioLevel} isActive={isActive} />
          {lastDetection && (
            <WakePhraseIndicator
              phrase={lastDetection.phrase}
              confidence={lastDetection.confidence}
              timestamp={lastDetection.timestamp}
            />
          )}
        </>
      )}
    </div>
  );
}
```

## Performance Optimization

### CPU Usage

- Use `requestAnimationFrame` for audio level monitoring
- Throttle speech recognition processing
- Efficient buffer management

### Memory Usage

- Circular buffer prevents memory leaks
- Automatic cleanup on unmount
- Blob-based storage for efficiency

### Battery Life (Mobile)

- Optimized sample rate (16kHz)
- Mono channel recording
- Minimal processing overhead

## Error Handling

```typescript
try {
  await startListening();
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied microphone permission
  } else if (error.name === 'NotFoundError') {
    // No microphone found
  } else {
    // Other error
  }
}
```

## Security Considerations

1. **Permissions**: Always request user permission before accessing microphone
2. **Privacy**: Audio is processed locally, not sent to servers during monitoring
3. **Encryption**: Buffer data should be encrypted before transmission
4. **User Control**: Provide clear start/stop controls

## Troubleshooting

### Microphone Not Working

- Check browser permissions
- Verify microphone is connected
- Test in different browser
- Check system audio settings

### Wake Phrases Not Detected

- Speak clearly and loudly
- Check confidence threshold
- Verify speech recognition support
- Test with different phrases

### High CPU Usage

- Reduce sample rate
- Disable visualization
- Check for memory leaks
- Close other audio applications

## API Reference

See individual hook and component documentation for detailed API reference.
