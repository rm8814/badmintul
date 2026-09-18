import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }

const variants = {
  primary: 'bg-brand-primary text-white hover:bg-violet-700',
  secondary: 'border border-brand-primary text-brand-primary hover:bg-brand-primary/5',
  danger: 'bg-brand-danger text-white hover:bg-red-700',
}

export default function Button({ variant = 'primary', className = '', disabled, ...props }: ButtonProps) {
  return <button disabled={disabled} className={`rounded-control px-4 py-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />
}
