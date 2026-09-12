import './Icon.css'

export function Icon({
	name,
	size = 24,
	filled = false,
	className = '',
}: {
	name: string
	size?: number
	filled?: boolean
	className?: string
}) {
	return (
		<span
			className={`material-symbols-outlined${filled ? ' msr--filled' : ''} ${className}`}
			style={{ fontSize: size }}
			aria-hidden
		>
			{name}
		</span>
	)
}
