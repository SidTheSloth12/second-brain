declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    ticks?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    scalar?: number
    shapes?: ('square' | 'circle')[]
    zIndex?: number
    disableForReducedMotion?: boolean
    [key: string]: unknown
  }

  export interface CreateTypes {
    (options?: ConfettiOptions): boolean
  }

  const confetti: CreateTypes
  export default confetti
}
