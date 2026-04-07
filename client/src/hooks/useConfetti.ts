/**
 * Hook to trigger a confetti animation on demand.
 * Uses canvas-confetti with minimal impact.
 */
export function useConfetti() {
  return async (options?: { duration?: number; particleCount?: number }) => {
    try {
      const confetti = (await import('canvas-confetti')).default

      // Conservative defaults for subtle effect
      confetti({
        particleCount: options?.particleCount ?? 50,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
        duration: options?.duration ?? 2000,
        startVelocity: 30,
        gravity: 0.5,
      })
    } catch (error) {
      // Gracefully handle if canvas-confetti fails to load
      console.warn('Confetti animation failed', error)
    }
  }
}
