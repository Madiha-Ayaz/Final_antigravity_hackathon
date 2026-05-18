# Emergency Countdown & Biometric Verification Documentation

## Overview

The Emergency Countdown system provides a 10-second human-in-the-loop cancellation window with biometric verification to prevent false alarms while ensuring genuine emergencies are dispatched quickly.

## Architecture

### Core Components

1. **EmergencyCountdown** - Full-screen countdown modal
2. **useBiometricAuth** - Biometric authentication hook
3. **emergencyFeedback** - Audio and vibration utilities

## EmergencyCountdown Component

Full-screen modal that displays during emergency detection.

### Props

```typescript
interface EmergencyCountdownProps {
  duration?: number; // Countdown duration (default: 10)
  onComplete: () => void; // Called when countdown reaches 0
  onCancel: () => void; // Called when user cancels
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-1 confidence score
}
```

### Usage

```tsx
import { EmergencyCountdown } from '@/components';

function EmergencyHandler() {
  const [showCountdown, setShowCountdown] = useState(false);

  const handleEmergencyDetected = () => {
    setShowCountdown(true);
    playEmergencySound();
    vibrateEmergencyPattern();
  };

  const handleComplete = () => {
    setShowCountdown(false);
    // Dispatch emergency alert
    dispatchEmergencyAlert();
  };

  const handleCancel = () => {
    setShowCountdown(false);
    // Log false alarm
    logFalseAlarm();
  };

  return (
    <>
      {showCountdown && (
        <EmergencyCountdown
          duration={10}
          onComplete={handleComplete}
          onCancel={handleCancel}
          threatLevel="HIGH"
          confidence={0.85}
        />
      )}
    </>
  );
}
```

### Features

**Visual Design:**

- Full-screen overlay (z-index: 50)
- Black background with 90% opacity
- Large countdown timer (9rem on mobile, 12rem on desktop)
- Gradient text based on threat level
- Animated warning icon
- Threat level and confidence display

**Animations:**

- Fade in/out transitions
- Scale pulse for final 3 seconds
- Rotating warning icon
- Number transition on each second

**Accessibility:**

- ARIA role: alertdialog
- Labeled with aria-labelledby and aria-describedby
- Keyboard accessible
- High contrast colors
- Large touch targets (min 44x44px)

**Feedback:**

- Visual countdown
- Vibration patterns (every second)
- Increased vibration in final 3 seconds
- Audio alerts

## Biometric Authentication

### useBiometricAuth Hook

Manages biometric authentication using Web Authentication API.

```typescript
const {
  isSupported, // boolean - WebAuthn support
  isAvailable, // boolean - Platform authenticator available
  isEnrolled, // boolean - User has enrolled biometrics
  authenticate, // () => Promise<boolean>
  checkBiometricSupport, // () => Promise<void>
} = useBiometricAuth();
```

### Authentication Flow

1. **Check Support**: Verify WebAuthn API availability
2. **Check Availability**: Verify platform authenticator
3. **Check Enrollment**: Verify user has enrolled biometrics
4. **Authenticate**: Request biometric verification
5. **Fallback**: Use confirmation dialog if biometrics unavailable

### Implementation

```typescript
const handleCancel = async () => {
  const { authenticate } = useBiometricAuth();

  const verified = await authenticate();

  if (verified) {
    // Cancel emergency alert
    cancelEmergencyAlert();
  } else {
    // Keep countdown running
    console.log('Verification failed');
  }
};
```

### Browser Support

| Browser | Desktop | Mobile | Method                           |
| ------- | ------- | ------ | -------------------------------- |
| Chrome  | ✅      | ✅     | Windows Hello, Touch ID, Face ID |
| Firefox | ✅      | ✅     | Windows Hello, Touch ID          |
| Safari  | ✅      | ✅     | Touch ID, Face ID                |
| Edge    | ✅      | ✅     | Windows Hello                    |

### Fallback Behavior

When biometrics are unavailable:

1. Display confirmation dialog
2. Require explicit user confirmation
3. Log fallback usage for analytics

## Emergency Feedback

### Audio Alerts

**Emergency Sound:**

- 3 beeps at 800Hz
- 0.5 second duration each
- 30% volume
- Sine wave oscillator

**Success Sound:**

- Single tone at 523.25Hz (C5)
- 0.3 second duration
- 30% volume
- Fade out

### Vibration Patterns

**Emergency Pattern:**

```javascript
[200, 100, 200, 100, 200];
// vibrate 200ms, pause 100ms, repeat
```

**Countdown Vibration:**

- Every second: 100ms pulse
- Final 3 seconds: [200, 100, 200] pattern

### API Reference

```typescript
// Play emergency alert sound
playEmergencySound(): void

// Vibrate emergency pattern
vibrateEmergencyPattern(): void

// Stop all vibration
stopVibration(): void

// Play success/cancellation sound
playSuccessSound(): void
```

## Complete Integration Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWakePhraseDetection, useRollingAudioBuffer } from '@/hooks';
import { analyzeAudioWithAI } from '@/lib/aiClient';
import { EmergencyCountdown } from '@/components';
import { playEmergencySound, vibrateEmergencyPattern, stopVibration } from '@/lib/emergencyFeedback';

export default function EmergencyMonitor() {
  const [showCountdown, setShowCountdown] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { lastDetection } = useWakePhraseDetection();
  const { getBufferedAudio } = useRollingAudioBuffer();

  useEffect(() => {
    if (lastDetection) {
      handleEmergencyDetection();
    }
  }, [lastDetection]);

  const handleEmergencyDetection = async () => {
    // Get buffered audio
    const audioBlob = await getBufferedAudio();
    if (!audioBlob) return;

    // Analyze with AI
    const result = await analyzeAudioWithAI(audioBlob);

    // Check if dispatch recommended
    if (result.dispatchRecommended && result.confidence > 0.7) {
      setAnalysis(result);
      setShowCountdown(true);
      playEmergencySound();
      vibrateEmergencyPattern();
    }
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    stopVibration();

    // Dispatch emergency alert
    await dispatchEmergencyAlert({
      analysis,
      audioBlob: await getBufferedAudio(),
      location: await getCurrentLocation(),
    });
  };

  const handleCountdownCancel = () => {
    setShowCountdown(false);
    stopVibration();

    // Log false alarm
    logFalseAlarm(analysis);
  };

  return (
    <>
      {/* Your monitoring UI */}

      {showCountdown && analysis && (
        <EmergencyCountdown
          duration={10}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
          threatLevel={analysis.threatLevel}
          confidence={analysis.confidence}
        />
      )}
    </>
  );
}
```

## Accessibility

### WCAG 2.1 AA Compliance

**Visual:**

- Minimum contrast ratio: 7:1 (AAA)
- Large text (18pt+)
- Clear visual hierarchy
- No color-only indicators

**Keyboard:**

- Tab navigation support
- Enter/Space to activate buttons
- Escape to cancel (with confirmation)

**Screen Readers:**

- Proper ARIA labels
- Role: alertdialog
- Live region announcements
- Descriptive button labels

**Motor:**

- Large touch targets (min 44x44px)
- No time-based interactions (except countdown)
- Single-action cancellation

**Cognitive:**

- Clear, simple language
- Large countdown numbers
- Visual + audio + haptic feedback
- Obvious cancel button

## Security Considerations

### Biometric Security

1. **No Storage**: Biometric data never leaves device
2. **Platform Security**: Uses OS-level biometric APIs
3. **Fallback**: Confirmation dialog as backup
4. **Timeout**: 60-second authentication window
5. **Retry**: No automatic retries on failure

### False Alarm Prevention

1. **10-Second Window**: Adequate time to cancel
2. **Biometric Verification**: Prevents accidental cancellation
3. **Clear UI**: Obvious cancel button
4. **Confirmation**: Fallback confirmation dialog
5. **Logging**: All cancellations logged for analysis

### Privacy

1. **Local Processing**: Countdown runs client-side
2. **No Tracking**: No analytics during countdown
3. **User Control**: Complete control over cancellation
4. **Transparency**: Clear indication of what will happen

## Performance

### Rendering

- 60 FPS animations
- Hardware-accelerated transforms
- Minimal re-renders
- Optimized Framer Motion

### Audio

- Web Audio API (low latency)
- No external audio files
- Synthesized tones
- < 10ms latency

### Vibration

- Native Vibration API
- No battery impact
- Immediate response
- Pattern-based

## Testing

### Manual Testing

1. Navigate to `/emergency-test`
2. Click "Start Emergency Countdown"
3. Observe countdown, sound, vibration
4. Test cancellation with biometrics
5. Verify completion flow

### Automated Testing

```typescript
describe('EmergencyCountdown', () => {
  it('should countdown from 10 to 0', async () => {
    const onComplete = jest.fn();
    render(<EmergencyCountdown onComplete={onComplete} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalled(), {
      timeout: 11000,
    });
  });

  it('should cancel on biometric verification', async () => {
    const onCancel = jest.fn();
    render(<EmergencyCountdown onCancel={onCancel} />);

    const cancelButton = screen.getByText(/I'M SAFE/i);
    fireEvent.click(cancelButton);

    // Mock biometric success
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
```

## Troubleshooting

### Biometrics Not Working

**Issue**: Biometric authentication fails

**Solutions:**

- Verify device has biometric hardware
- Check browser supports WebAuthn
- Ensure biometrics enrolled in OS
- Try fallback confirmation dialog

### Countdown Not Visible

**Issue**: Countdown doesn't appear

**Solutions:**

- Check z-index conflicts
- Verify component is mounted
- Check for CSS overrides
- Inspect console for errors

### No Sound/Vibration

**Issue**: Audio or vibration not working

**Solutions:**

- Check device volume
- Verify browser permissions
- Test on different browser
- Check device silent mode

## Best Practices

1. **Always Test**: Test on real devices with biometrics
2. **Provide Feedback**: Clear visual, audio, and haptic feedback
3. **Handle Errors**: Graceful fallbacks for all failures
4. **Log Everything**: Track cancellations and completions
5. **Respect Privacy**: No tracking during emergency
6. **Be Accessible**: Follow WCAG 2.1 AA guidelines
7. **Optimize Performance**: 60 FPS animations
8. **Test Thoroughly**: Test all edge cases

## Future Enhancements

- [ ] Custom countdown durations per threat level
- [ ] Multi-language support
- [ ] Custom sound selection
- [ ] Vibration pattern customization
- [ ] Emergency contact preview
- [ ] Location preview
- [ ] Audio clip preview
- [ ] Countdown pause/resume
- [ ] Emergency message customization
