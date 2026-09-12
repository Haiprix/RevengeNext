import { useState } from 'react'
import { Button, Card, Icon, TextField, useSnackbar } from '../components/ui'
import { api, isValidSnowflake } from '../lib/api'

const EMPTY = { mainId: '', altId: '', warning: '', reporterId: '' }

export function ReportPage() {
	const [form, setForm] = useState(EMPTY)
	const [submitting, setSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [done, setDone] = useState(false)
	const snackbar = useSnackbar()

	async function submit() {
		setFormError(null)
		if (!isValidSnowflake(form.mainId)) {
			setFormError('Main account must be a valid Discord user ID.')
			return
		}
		if (!isValidSnowflake(form.altId)) {
			setFormError('Alt account must be a valid Discord user ID.')
			return
		}
		if (form.mainId === form.altId) {
			setFormError('An account cannot be its own alt.')
			return
		}
		setSubmitting(true)
		try {
			await api.report({
				mainId: form.mainId,
				altId: form.altId,
				warning: form.warning.trim(),
				reporterId: isValidSnowflake(form.reporterId)
					? form.reporterId
					: undefined,
			})
			setDone(true)
			snackbar('Report submitted for review.')
		} catch (e) {
			snackbar((e as any)?.message ?? 'Failed to submit the report.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<>
			<h2 className="page-heading">
				Report an <strong>alt-account link</strong>
			</h2>

			<div className="note">
				<Icon name="verified_user" size={20} />
				<span>
					Submissions are reviewed by a moderator before they go live. False
					positives can be disputed on the Search tab.
				</span>
			</div>

			{formError && <div className="note note--error">{formError}</div>}

			{!done ? (
				<Card variant="outlined">
					<p className="card__headline">Link two accounts</p>
					<TextField
						label="Main account ID"
						inputMode="numeric"
						value={form.mainId}
						onChange={v => setForm({ ...form, mainId: v.replace(/\D/g, '') })}
						supportingText="The primary account of the same person."
					/>
					<TextField
						label="Alt account ID"
						inputMode="numeric"
						value={form.altId}
						onChange={v => setForm({ ...form, altId: v.replace(/\D/g, '') })}
						supportingText="The secondary account you believe is linked."
					/>
					<TextField
						label="Warning (optional)"
						multiline
						value={form.warning}
						onChange={v => setForm({ ...form, warning: v })}
						maxLength={200}
					/>
					<TextField
						label="Your user ID (optional)"
						inputMode="numeric"
						value={form.reporterId}
						onChange={v =>
							setForm({ ...form, reporterId: v.replace(/\D/g, '') })
						}
					/>
					<Button block icon="add" onClick={submit} disabled={submitting}>
						{submitting ? 'Submitting…' : 'Submit report'}
					</Button>
				</Card>
			) : (
				<Card variant="filled">
					<p className="card__headline">Thanks, your report is in review.</p>
					<p className="card__supporting">
						The link between <span className="mono">{form.mainId}</span> and{' '}
						<span className="mono">{form.altId}</span> will appear in searches
						once it's approved.
					</p>
					<div className="card__actions">
						<Button
							variant="tonal"
							icon="refresh"
							onClick={() => {
								setDone(false)
								setForm(EMPTY)
							}}
						>
							Report another
						</Button>
					</div>
				</Card>
			)}
		</>
	)
}
