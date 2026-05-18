export function playEmergencySound() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) {
    return;
  }

  try {
    const audioContext = new AudioContext();
    const duration = 0.5;
    const frequency = 800;

    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * duration);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + i * duration + duration
      );

      oscillator.start(audioContext.currentTime + i * duration);
      oscillator.stop(audioContext.currentTime + i * duration + duration);
    }
  } catch (error) {
    console.error('Failed to play emergency sound:', error);
  }
}

export function vibrateEmergencyPattern() {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    navigator.vibrate([200, 100, 200, 100, 200]);
  } catch (error) {
    console.error('Failed to vibrate:', error);
  }
}

export function stopVibration() {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.error('Failed to stop vibration:', error);
  }
}

export function playSuccessSound() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) {
    return;
  }

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 523.25;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Failed to play success sound:', error);
  }
}
