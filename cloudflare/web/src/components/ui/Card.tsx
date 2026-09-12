import type { ReactNode } from 'react'
import './Card.css'

export function Card({
	children,
	variant = 'elevated',
	className = '',
}: {
	children: ReactNode
	variant?: 'elevated' | 'filled' | 'outlined'
	className?: string
}) {
	return <div className={`card card--${variant} ${className}`}>{children}</div>
}
