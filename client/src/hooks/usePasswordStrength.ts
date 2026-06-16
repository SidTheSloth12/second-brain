import { useMemo } from'react'
export type PasswordStrengthLevel ='weak' |'strong' |'very-strong'
export interface PasswordStrengthResult {
 level: PasswordStrengthLevel
 score: number
 feedback:string[]
 percentage: number
}
export function usePasswordStrength(password:string): PasswordStrengthResult {
 return useMemo(()=>{
 const feedback:string[]=[]
 let score=0
 if (password.length===0) {
 return {
 level:'weak',
 score: 0,
 feedback: ['Enter a password'],
 percentage: 0,
 }
 }
 if (password.length>=8) {
 score+=20
 } else {
 feedback.push(`At least 8 characters (${password.length}/8)`)
 }
 if (password.length>=16) {
 score+=10
 }
 if (/[A-Z]/.test(password)) {
 score+=15
 } else {
 feedback.push('Include uppercase letters (A-Z)')
 }
 if (/[a-z]/.test(password)) {
 score+=15
 } else {
 feedback.push('Include lowercase letters (a-z)')
 }
 if (/\d/.test(password)) {
 score+=20
 } else {
 feedback.push('Include numbers (0-9)')
 }
 if (/[!@#$%^&*()_+\- = \[\]{};':"\\|, .<>\/?]/.test(password)) {
 score+=20
 } else {
 feedback.push('Include special characters (!@#$%^&* etc.)')
 }
 let level: PasswordStrengthLevel
 let percentage: number
 if (score>=80) {
 level ='very-strong'
 percentage=100
 } else if (score>=50) {
 level ='strong'
 percentage=70
 } else {
 level ='weak'
 percentage=30
 }
 return {
 level,
 score,
 feedback,
 percentage,
 }
 }, [password])
}