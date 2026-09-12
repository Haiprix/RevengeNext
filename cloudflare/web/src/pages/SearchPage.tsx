import { useState } from 'react'
import {
	profileHref,
	shortId,
	snowflakeCreatedAt,
	UserAvatar,
} from '../components/UserAvatar'
import {
	Button,
	EmptyState,
	Icon,
	Spinner,
	TextField,
	useSnackbar,
} from '../components/ui'
import { api, formatDate, isValidSnowflake } from '../lib/api'
import { AppealDialog } from './search/AppealDialog'
import { EntryCard } from './search/EntryCard'
import type { FormEvent } from 'react'
import type { AltEntry, DiscordUser } from '../lib/types'
import './SearchPage.css'

const MAX_PROFILE_FETCHES = 12

export function SearchPage() {
	const [query, setQuery] = useState('')
	const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
	const [userId, setUserId] = useState('')
	const [entries, setEntries] = useState<AltEntry[]>([])
	const [profile, setProfile] = useState<DiscordUser | null>(null)
	const [profiles, setProfiles] = useState<Record<string, DiscordUser>>({})
	const [error, setError] = useState<string | null>(null)
	const [disputed, setDisputed] = useState<AltEntry | null>(null)
	const snackbar = useSnackbar()

	async function runSearch(target = query) {
		if (!isValidSnowflake(target)) {
			setError('That does not look like a Discord user ID.')
			setState('idle')
			return
		}
		setState('loading')
		setError(null)
		setProfile(null)
		setProfiles({})
		try {
			const result = await api.lookup(target)
			setUserId(target)
			setEntries(result.entries)

			const ids = [target, ...result.entries.flatMap(e => [e.mainId, e.altId])]
				.filter((id, i, all) => id !== target && all.indexOf(id) === i)
				.slice(0, MAX_PROFILE_FETCHES)

			const fetchProfile = (
				id: string,
			): Promise<readonly [string, DiscordUser] | null> =>
				api
					.discordProfile(id)
					.then((u: DiscordUser) => [u.id, u] as const)
					.catch(() => null)

			const self = await api.discordProfile(target).catch(() => null)
			const others = (await Promise.all(ids.map(fetchProfile))).filter(
				(p): p is readonly [string, DiscordUser] => p != null,
			)
			setProfile(self)
			const map: Record<string, DiscordUser> = {}
			for (const [id, u] of others) {
				map[id] = u
			}
			setProfiles(map)
		} catch (e) {
			setError((e as any)?.message ?? 'Search failed')
		} finally {
			setState('done')
		}
	}

	const onSubmit = (e: FormEvent) => {
		e.preventDefault()
		runSearch()
	}

	const profileName = (id: string, p?: DiscordUser | null) =>
		p?.displayName ?? `User ${shortId(id)}`

	return (
		<>
			<h2 className="page-heading">
				Search <strong>linked accounts</strong>
			</h2>

			<form onSubmit={onSubmit}>
				<TextField
					label="Discord user ID"
					inputMode="numeric"
					value={query}
					onChange={v => setQuery(v.replace(/\D/g, ''))}
					supportingText="Paste a user ID to look up linked accounts."
					error={state === 'idle' && error != null}
				/>
				<Button type="submit" block icon="manage_search">
					Search
				</Button>
			</form>

			{state === 'loading' && <Spinner />}

			{state === 'idle' && error != null && (
				<div className="note note--error">{error}</div>
			)}

			{state === 'idle' && error == null && (
				<EmptyState
					icon="shield"
					title="Welcome to AltMaster"
					text="A community-run database of Discord alt-account links. Search any user id, report suspicious links, and dispute wrong ones."
				/>
			)}

			{state === 'done' && error == null && (
				<>
					{userId != null && (
						<div className="search-hero">
							<UserAvatar
								id={userId}
								hash={profile?.avatar}
								size={72}
								name={profileName(userId, profile)}
							/>
							<div className="search-hero__text">
								<div className="search-hero__name">
									{profileName(userId, profile)}
									{profile?.bot && (
										<span className="identity-badge identity-badge--small">
											BOT
										</span>
									)}
								</div>
								<div className="search-hero__sub">
									{profile ? (
										<>
											@{profile.username}
											{profile.discriminator != null
												? `#${profile.discriminator}`
												: ''}
										</>
									) : (
										<span className="mono">{userId}</span>
									)}
								</div>
								<p className="search-hero__meta">
									{snowflakeCreatedAt(userId) != null &&
										`Account created ${formatDate(
											(snowflakeCreatedAt(userId) as Date).getTime() / 1000,
										)}`}
								</p>
							</div>
							<a
								className="search-hero__open"
								href={profileHref(userId)}
								target="_blank"
								rel="noreferrer"
							>
								<Icon name="open_in_new" size={18} />
								Open profile
							</a>
						</div>
					)}

					{entries.length === 0 ? (
						<EmptyState
							icon="manage_search"
							title="No entries found"
							text="This user isn't linked to any account in the database yet. If you're confident about a link, report it."
						/>
					) : (
						<>
							<span className="section-label">
								{entries.length} linked account{entries.length === 1 ? '' : 's'}
							</span>
							<div className="results-list">
								{entries.map(entry => (
									<EntryCard
										key={entry.id}
										entry={entry}
										userId={userId}
										profile={profile}
										otherProfile={profiles[otherIdOf(entry, userId)] ?? null}
										onDispute={setDisputed}
									/>
								))}
							</div>
						</>
					)}
				</>
			)}

			{state === 'done' && error != null && (
				<div className="note note--error">{error}</div>
			)}

			<AppealDialog
				key={disputed?.id ?? 'none'}
				entry={disputed}
				userId={userId}
				onClose={() => setDisputed(null)}
				onComplete={() => {
					setDisputed(null)
					snackbar('False-positive request sent for review.')
				}}
			/>
		</>
	)
}

function otherIdOf(entry: AltEntry, userId: string): string {
	return entry.mainId === userId ? entry.altId : entry.mainId
}
