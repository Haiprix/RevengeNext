import { profileHref, shortId, UserAvatar } from '../../components/UserAvatar'
import { Button, Card, Icon } from '../../components/ui'
import type { AltEntry, DiscordUser } from '../../lib/types'
import './EntryCard.css'

function displayName(p: DiscordUser | null, id: string): string {
	return p?.displayName ?? `User ${shortId(id)}`
}

function profileButton(id: string, label: string) {
	return (
		<a
			className="entry-card__open"
			href={profileHref(id)}
			target="_blank"
			rel="noreferrer"
			aria-label={`Open profile of ${label}`}
		>
			<Icon name="open_in_new" size={16} />
		</a>
	)
}

export function EntryCard({
	entry,
	userId,
	profile,
	otherProfile,
	onDispute,
}: {
	entry: AltEntry
	userId: string
	profile: DiscordUser | null
	otherProfile: DiscordUser | null
	onDispute: (entry: AltEntry) => void
}) {
	const otherId = entry.mainId === userId ? entry.altId : entry.mainId

	return (
		<Card>
			<div className="entry-card__link">
				<UserAvatar
					id={userId}
					hash={profile?.avatar}
					size={40}
					name={displayName(profile, userId)}
				/>
				<span className="entry-card__line" aria-hidden />
				<UserAvatar
					id={otherId}
					hash={otherProfile?.avatar}
					size={40}
					name={displayName(otherProfile, otherId)}
				/>
				<div className="entry-card__names">
					<div className="entry-card__name">
						<span className="entry-card__name-text">
							{displayName(profile, userId)}
						</span>
						{profileButton(userId, displayName(profile, userId))}
					</div>
					<div className="entry-card__name">
						<span className="entry-card__name-text">
							{displayName(otherProfile, otherId)}
						</span>
						{profileButton(otherId, displayName(otherProfile, otherId))}
					</div>
				</div>
			</div>
			<p className="card__supporting entry-card__ids">
				<span className="mono">{userId}</span> →{' '}
				<span className="mono">{otherId}</span>
			</p>
			{entry.warning && (
				<p className="card__supporting entry-card__warning">
					⚠ {entry.warning}
				</p>
			)}
			<div className="card__actions">
				<Button variant="tonal" icon="flag" onClick={() => onDispute(entry)}>
					Report false positive
				</Button>
			</div>
		</Card>
	)
}
