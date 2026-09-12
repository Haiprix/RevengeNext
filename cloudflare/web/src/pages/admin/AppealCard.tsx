import { LinkedPair } from '../../components/LinkedPair'
import { profileHref, shortId } from '../../components/UserAvatar'
import { Button, Card, Icon } from '../../components/ui'
import { formatDate } from '../../lib/api'
import type { Appeal, DiscordUser } from '../../lib/types'

function disputerName(
	profiles: Record<string, DiscordUser>,
	appeal: Appeal,
): string {
	return (
		profiles[appeal.disputerId]?.displayName ??
		`User ${shortId(appeal.disputerId)}`
	)
}

export function AppealCard({
	appeal,
	profiles,
	onAction,
}: {
	appeal: Appeal
	profiles: Record<string, DiscordUser>
	onAction: (action: 'keep' | 'remove') => void
}) {
	return (
		<Card>
			<div className="card__actions" style={{ marginTop: 0 }}>
				<div className="identity-badge">Appeal</div>
				<span style={{ marginLeft: 'auto' }} className="card__supporting">
					{formatDate(appeal.createdAt)}
				</span>
			</div>

			<LinkedPair
				main={{ id: appeal.mainId, profile: profiles[appeal.mainId] }}
				alt={{ id: appeal.linkedAltId, profile: profiles[appeal.linkedAltId] }}
				warning={appeal.warning}
			/>

			<p className="card__supporting entry-card__warning">
				Disputed by {disputerName(profiles, appeal)}
				<span className="mono"> ({shortId(appeal.disputerId)})</span>
				<a
					className="entry-card__open"
					style={{ display: 'inline-grid' }}
					href={profileHref(appeal.disputerId)}
					target="_blank"
					rel="noreferrer"
					aria-label={`Open profile of the disputer ${appeal.disputerId}`}
				>
					<Icon name="open_in_new" size={14} />
				</a>
			</p>

			{appeal.reason && (
				<p className="card__supporting entry-card__warning">
					“{appeal.reason}”
				</p>
			)}

			<div className="card__actions">
				<Button
					variant="tonal"
					icon="verified"
					onClick={() => onAction('keep')}
				>
					Keep
				</Button>
				<Button
					variant="outlined"
					icon="delete"
					onClick={() => onAction('remove')}
				>
					Remove as false positive
				</Button>
			</div>
		</Card>
	)
}
