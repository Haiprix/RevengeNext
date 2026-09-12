import { useState } from 'react'
import { Button, Dialog, TextField } from '../../components/ui'
import { api, isValidSnowflake } from '../../lib/api'
import type { AltEntry } from '../../lib/types'

export function AppealDialog({
	entry,
	userId,
	onClose,
	onComplete,
}: {
	entry: AltEntry | null
	userId: string
	onClose: () => void
	onComplete: () => void
}) {
	const [appealId, setAppealId] = useState(userId)
	const [reason, setReason] = useState('')
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	async function submit() {
		if (!entry) return
		if (!isValidSnowflake(appealId)) {
			setError('Enter a valid Discord user ID.')
			return
		}
		setSubmitting(true)
		try {
			await api.appeal(entry.id, { userId: appealId, reason: reason.trim() })
			onComplete()
		} catch (e) {
			setError((e as any)?.message ?? 'Failed to send request.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Dialog
			open={entry != null}
			title="Report false positive"
			onClose={onClose}
			actions={
				<>
					<Button variant="text" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button onClick={submit} disabled={submitting}>
						Send request
					</Button>
				</>
			}
		>
			<p>
				You are disputing the entry linking{' '}
				<span className="mono">{entry?.mainId}</span> to{' '}
				<span className="mono">{entry?.altId}</span>. A moderator will review it
				and remove the link if it's wrong.
			</p>
			<TextField
				label="Your user ID"
				inputMode="numeric"
				value={appealId}
				onChange={v => setAppealId(v.replace(/\D/g, ''))}
				error={error !== ''}
				supportingText={error || 'The account being wrongly linked.'}
			/>
			<TextField
				label="Why is this wrong?"
				multiline
				value={reason}
				onChange={setReason}
				maxLength={300}
			/>
		</Dialog>
	)
}
