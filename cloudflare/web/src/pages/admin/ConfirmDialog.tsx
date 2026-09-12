import { Button, Dialog } from '../../components/ui'
import type { ReactNode } from 'react'

export interface ConfirmState {
	title: string
	confirmLabel: string
	detail: ReactNode
}

export function ConfirmDialog({
	state,
	busy,
	onConfirm,
	onClose,
}: {
	state: ConfirmState | null
	busy: boolean
	onConfirm: () => void
	onClose: () => void
}) {
	return (
		<Dialog
			open={state != null}
			title={state?.title ?? ''}
			onClose={onClose}
			actions={
				<>
					<Button variant="text" onClick={onClose} disabled={busy}>
						Cancel
					</Button>
					<Button onClick={onConfirm} disabled={busy}>
						{state?.confirmLabel}
					</Button>
				</>
			}
		>
			<p>{state?.detail}</p>
		</Dialog>
	)
}
