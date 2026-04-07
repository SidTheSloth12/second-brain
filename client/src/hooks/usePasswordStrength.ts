import { useMemo } from 'react'

export type PasswordStrengthLevel = 'weak' | 'strong' | 'very-strong'

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel
  score: number
  feedback: string[]
  percentage: number
}

/**
 * Custom hook to evaluate password strength based on multiple criteria:
 * - Length (minimum 8 characters)
 * - Uppercase letters
 * - Lowercase letters
 * - Numbers
 * - Special characters
 */
export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    const feedback: string[] = []
    let score = 0

    // Length check (minimum 8)
    if (password.length === 0) {
      return {
        level: 'weak',
        score: 0,
        feedback: ['Enter a password'],
        percentage: 0,
      }
    }

    if (password.length >= 8) {
      score += 20
    } else {
      feedback.push(`At least 8 characters (${password.length}/8)`)
    }

    // Length bonus (up to 40 chars)
    if (password.length >= 16) {
      score += 10
    }

    // Uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 15
    } else {
      feedback.push('Include uppercase letters (A-Z)')
    }

    // Lowercase letters
    if (/[a-z]/.test(password)) {
      score += 15
    } else {
      feedback.push('Include lowercase letters (a-z)')
    }

    // Numbers
    if (/\d/.test(password)) {
      score += 20
    } else {
      feedback.push('Include numbers (0-9)')
    }

    // Special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 20
    } else {
      feedback.push('Include special characters (!@#$%^&* etc.)')
    }

    // Determine level and percentage
    let level: PasswordStrengthLevel
    let percentage: number

    if (score >= 80) {
      level = 'very-strong'
      percentage = 100
    } else if (score >= 50) {
      level = 'strong'
      percentage = 70
    } else {
      level = 'weak'
      percentage = 30
    }

    return {
      level,
      score,
      feedback,
      percentage,
    }
  }, [password])
}
