import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import './Dialog.css'

export function Dialog({
	open,
	title,
	onClose,
	children,
	actions,
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
	actions?: ReactNode
}) {
	if (!open) return null
	return createPortal(
		<div className="dialog-scrim">
			<button
				type="button"
				className="dialog-scrim__dismiss"
				aria-label="Close dialog"
				onClick={onClose}
			/>
			<div
				className="dialog"
				role="dialog"
				aria-modal
				onClick={e => e.stopPropagation()}
			>
				<h2 className="dialog__title">{title}</h2>
				<div className="dialog__content">{children}</div>
				{actions && <div className="dialog__actions">{actions}</div>}
			</div>
		</div>,
		document.body,
	)
}
