export function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  const codeMatch = raw.match(/auth\/[a-z0-9-]+/i);
  const code = codeMatch?.[0]?.toLowerCase() || '';

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'An account already exists for this email.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Connection problem. Check your internet and try again.',
    'auth/popup-closed-by-user': 'Sign-in window was closed before completion.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
    'auth/cancelled-popup-request': 'Another sign-in attempt is already open.',
    'auth/operation-not-allowed': 'This sign-in method is not available right now.',
  };

  return messages[code] || 'Sign-in could not be completed. Please try again.';
}
