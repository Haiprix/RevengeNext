import { profileHref, shortId, UserAvatar } from './UserAvatar'
import { Icon } from './ui'
import type { DiscordUser } from '../lib/types'
import './LinkedPair.css'

function displayName(profile: DiscordUser | null | undefined, id: string) {
	return profile?.displayName ?? `User ${shortId(id)}`
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

export function LinkedPair({
	main,
	alt,
	warning,
}: {
	main: { id: string; profile?: DiscordUser | null }
	alt: { id: string; profile?: DiscordUser | null }
	warning?: string
}) {
	return (
		<>
			<div className="entry-card__link">
				<UserAvatar
					id={main.id}
					hash={main.profile?.avatar}
					size={40}
					name={displayName(main.profile, main.id)}
				/>
				<span className="entry-card__line" aria-hidden />
				<UserAvatar
					id={alt.id}
					hash={alt.profile?.avatar}
					size={40}
					name={displayName(alt.profile, alt.id)}
				/>
				<div className="entry-card__names">
					<div className="entry-card__name">
						<span className="entry-card__name-text">
							{displayName(main.profile, main.id)}
						</span>
						{profileButton(main.id, displayName(main.profile, main.id))}
					</div>
					<div className="entry-card__name">
						<span className="entry-card__name-text">
							{displayName(alt.profile, alt.id)}
						</span>
						{profileButton(alt.id, displayName(alt.profile, alt.id))}
					</div>
				</div>
			</div>
			<p className="card__supporting entry-card__ids">
				<span className="mono">{main.id}</span> →{' '}
				<span className="mono">{alt.id}</span>
			</p>
			{warning && (
				<p className="card__supporting entry-card__warning">⚠ {warning}</p>
			)}
		</>
	)
}
