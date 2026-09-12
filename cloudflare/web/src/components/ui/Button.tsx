import type { ReactNode } from 'react'
import './Button.css'
import { Icon } from './Icon'

export function Button({
	children,
	onClick,
	variant = 'filled',
	disabled = false,
	block = false,
	type = 'button',
	icon,
}: {
	children?: ReactNode
	onClick?: () => void
	variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'
	disabled?: boolean
	block?: boolean
	type?: 'button' | 'submit'
	icon?: string
}) {
	return (
		<button
			type={type}
			className={`button button--${variant}${block ? ' button--block' : ''}`}
			onClick={onClick}
			disabled={disabled}
		>
			{icon && <Icon name={icon} size={18} />}
			{children}
		</button>
	)
}
