import { LinkedPair } from '../../components/LinkedPair'
import { profileHref, shortId } from '../../components/UserAvatar'
import { Button, Card, Icon, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/api'
import type { DiscordUser, Report } from '../../lib/types'

function reporterName(
	profiles: Record<string, DiscordUser>,
	report: Report,
): string {
	const reporterId = report.reporterId
	if (!reporterId) return 'Anonymous'
	return profiles[reporterId]?.displayName ?? `User ${shortId(reporterId)}`
}

export function ReportCard({
	report,
	profiles,
	onAction,
}: {
	report: Report
	profiles: Record<string, DiscordUser>
	onAction: (action: 'approve' | 'reject' | 'delete') => void
}) {
	return (
		<Card>
			<div className="card__actions" style={{ marginTop: 0 }}>
				<StatusBadge status={report.status} />
				<span style={{ marginLeft: 'auto' }} className="card__supporting">
					{formatDate(report.createdAt)}
				</span>
			</div>

			<LinkedPair
				main={{ id: report.mainId, profile: profiles[report.mainId] }}
				alt={{ id: report.altId, profile: profiles[report.altId] }}
				warning={report.warning}
			/>

			{report.reporterId && (
				<p className="card__supporting entry-card__warning">
					Reported by {reporterName(profiles, report)}
					<span className="mono"> ({shortId(report.reporterId)})</span>
					<a
						className="entry-card__open"
						style={{ display: 'inline-grid' }}
						href={profileHref(report.reporterId)}
						target="_blank"
						rel="noreferrer"
						aria-label={`Open profile of the reporter ${report.reporterId}`}
					>
						<Icon name="open_in_new" size={14} />
					</a>
				</p>
			)}

			<div className="card__actions">
				{report.status === 'pending' ? (
					<>
						<Button
							variant="tonal"
							icon="check"
							onClick={() => onAction('approve')}
						>
							Approve
						</Button>
						<Button
							variant="outlined"
							icon="close"
							onClick={() => onAction('reject')}
						>
							Reject
						</Button>
					</>
				) : (
					<Button
						variant="outlined"
						icon="delete"
						onClick={() => onAction('delete')}
					>
						Delete
					</Button>
				)}
			</div>
		</Card>
	)
}
