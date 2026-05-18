import { useState, useEffect, useCallback } from 'react';

interface BiometricState {
  isSupported: boolean;
  isAvailable: boolean;
  isEnrolled: boolean;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    isSupported: false,
    isAvailable: false,
    isEnrolled: false,
  });

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const isSupported = 'credentials' in navigator && 'PublicKeyCredential' in window;

    let isAvailable = false;
    let isEnrolled = false;

    if (isSupported) {
      try {
        isAvailable = await (
          window as any
        ).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

        if (isAvailable) {
          isEnrolled = await checkEnrollment();
        }
      } catch (error) {
        console.error('Error checking biometric support:', error);
      }
    }

    setState({
      isSupported,
      isAvailable,
      isEnrolled,
    });
  };

  const checkEnrollment = async (): Promise<boolean> => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 5000,
          userVerification: 'required',
        } as any,
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isAvailable) {
      return fallbackAuthentication();
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          authenticatorSelection: {
            userVerification: 'required',
          },
        } as any,
      });

      return credential !== null;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return fallbackAuthentication();
    }
  }, [state.isAvailable]);

  const fallbackAuthentication = (): boolean => {
    return confirm(
      'Biometric authentication is not available. Do you want to cancel the emergency alert?'
    );
  };

  return {
    ...state,
    authenticate,
    checkBiometricSupport,
  };
}
