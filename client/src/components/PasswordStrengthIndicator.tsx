import { usePasswordStrength, type PasswordStrengthLevel } from '../hooks/usePasswordStrength'

interface PasswordStrengthIndicatorProps {
  password: string
  showFeedback?: boolean
}

export function PasswordStrengthIndicator({
  password,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  const strength = usePasswordStrength(password)

  const getColors = (level: PasswordStrengthLevel) => {
    switch (level) {
      case 'weak':
        return {
          bg: 'bg-red-500',
          label: 'text-red-700 dark:text-red-400',
          labelBg: 'bg-red-50 dark:bg-red-900/20',
        }
      case 'strong':
        return {
          bg: 'bg-amber-500',
          label: 'text-amber-700 dark:text-amber-400',
          labelBg: 'bg-amber-50 dark:bg-amber-900/20',
        }
      case 'very-strong':
        return {
          bg: 'bg-green-500',
          label: 'text-green-700 dark:text-green-400',
          labelBg: 'bg-green-50 dark:bg-green-900/20',
        }
    }
  }

  const colors = getColors(strength.level)
  const label = strength.level === 'weak' ? 'Weak' : strength.level === 'strong' ? 'Strong' : 'Very Strong'

  return (
    <div className="mt-3 space-y-2">
      {/* Progress bar with animation */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${colors.labelBg} rounded px-2 py-1 ${colors.label}`}>
          {label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{strength.score}/100</span>
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((fb, idx) => (
            <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
              • {fb}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
