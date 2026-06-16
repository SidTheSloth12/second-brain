export function useConfetti() {
 return async (options?: { duration?: number; particleCount?: number })=>{
 try {
 const confetti=(await import('canvas-confetti')).default
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
 console.warn('Confetti animation failed', error)
 }
 }
}