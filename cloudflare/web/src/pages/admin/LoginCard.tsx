import { useState } from 'react'
import { Button, Card, TextField } from '../../components/ui'
import type { FormEvent } from 'react'

export function LoginCard({
	onLogin,
}: {
	onLogin: (password: string) => Promise<void>
}) {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)

	async function submit(e: FormEvent) {
		e.preventDefault()
		setBusy(true)
		setError('')
		try {
			await onLogin(password)
		} catch {
			setError('Wrong password.')
			setBusy(false)
		}
	}

	return (
		<form className="login-screen" onSubmit={submit}>
			<Card variant="outlined">
				<p className="card__headline">Moderator access</p>
				<p className="card__supporting">
					Enter the admin password to review reports and false positives.
				</p>
				<TextField
					label="Password"
					type="password"
					value={password}
					onChange={setPassword}
					error={error !== ''}
					supportingText={error || undefined}
				/>
				<Button block type="submit" icon="lock_open" disabled={busy}>
					{busy ? 'Checking…' : 'Unlock'}
				</Button>
			</Card>
		</form>
	)
}
