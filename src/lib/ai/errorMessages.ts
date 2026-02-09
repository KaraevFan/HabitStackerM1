/**
 * Convert raw AI/network errors into user-friendly messages.
 * Never expose raw error strings to users.
 */
export function sanitizeAIError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return 'Taking too long. Tap to retry.';
    }
    if (error.name === 'AbortError') {
      return 'Request was cancelled.';
    }
    if (
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    ) {
      return 'Lost connection. Tap to continue.';
    }
  }
  return 'Something went wrong. Tap to retry.';
}
