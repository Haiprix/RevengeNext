import { useId } from 'react'
import './TextField.css'

export function TextField({
	label,
	value,
	onChange,
	type = 'text',
	inputMode,
	multiline = false,
	supportingText,
	error = false,
	maxLength,
}: {
	label: string
	value: string
	onChange: (value: string) => void
	type?: string
	inputMode?: 'numeric' | 'text'
	multiline?: boolean
	supportingText?: string
	error?: boolean
	maxLength?: number
}) {
	const inputId = useId()
	return (
		<label className="text-field" htmlFor={inputId}>
			<span className="text-field__box" data-invalid={error || undefined}>
				{multiline ? (
					<textarea
						id={inputId}
						className="text-field__input"
						placeholder=" "
						value={value}
						rows={3}
						onChange={e => onChange(e.target.value)}
						maxLength={maxLength}
					/>
				) : (
					<input
						id={inputId}
						className="text-field__input"
						placeholder=" "
						type={type}
						inputMode={inputMode}
						value={value}
						onChange={e => onChange(e.target.value)}
						maxLength={maxLength}
					/>
				)}
				<span className="text-field__label">{label}</span>
			</span>
			{supportingText != null && (
				<span
					className={`text-field__supporting${error ? ' text-field__supporting--error' : ''}`}
				>
					{supportingText}
				</span>
			)}
		</label>
	)
}
