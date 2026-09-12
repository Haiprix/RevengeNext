import { useEffect, useState } from 'react'
import {
	Button,
	EmptyState,
	Spinner,
	Tabs,
	useSnackbar,
} from '../components/ui'
import { api, isValidSnowflake } from '../lib/api'
import { AppealCard } from './admin/AppealCard'
import { ConfirmDialog } from './admin/ConfirmDialog'
import { LoginCard } from './admin/LoginCard'
import { ReportCard } from './admin/ReportCard'
import type { Appeal, DiscordUser, Report, ReportStatus } from '../lib/types'
import type { ConfirmState } from './admin/ConfirmDialog'
import './AdminPage.css'

const ADMIN_KEY = 'alm.admin'
const ADMIN_PROFILE_CAP = 60
const PAGE_SIZE = 25

type PendingConfirm =
	| { kind: 'approve' | 'reject'; report: Report }
	| { kind: 'keep' | 'remove'; appeal: Appeal }
	| { kind: 'delete'; report: Report }

const STATUS_FILTERS: Array<ReportStatus | ''> = [
	'',
	'pending',
	'approved',
	'rejected',
	'removed',
]

export function AdminPage() {
	const [key, setKey] = useState(() => sessionStorage.getItem(ADMIN_KEY) ?? '')
	const [authed, setAuthed] = useState(
		() => sessionStorage.getItem(ADMIN_KEY) != null,
	)
	const [tab, setTab] = useState(0)
	const [pending, setPending] = useState<Report[]>([])
	const [appeals, setAppeals] = useState<Appeal[]>([])
	const [all, setAll] = useState<Report[]>([])
	const [allTotal, setAllTotal] = useState(0)
	const [allStatus, setAllStatus] = useState<ReportStatus | ''>('')
	const [page, setPage] = useState(0)
	const [profiles, setProfiles] = useState<Record<string, DiscordUser>>({})
	const [loading, setLoading] = useState(false)
	const [busy, setBusy] = useState(false)
	const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
	const snackbar = useSnackbar()

	function go(status = allStatus, pageNum = page) {
		setAllStatus(status)
		setPage(pageNum)
		refresh(key, status, pageNum).catch(() => {})
	}

	async function refresh(adminKey = key, status = allStatus, pageNum = page) {
		setLoading(true)
		try {
			const [pendingRes, appealsRes, allRes] = await Promise.all([
				api.reports('pending', adminKey),
				api.appeals('open', adminKey),
				api.adminEntries(status, pageNum, PAGE_SIZE, adminKey),
			])
			setPending(pendingRes.reports)
			setAppeals(appealsRes.appeals)
			setAll(allRes.entries)
			setAllTotal(allRes.total)
			setProfiles(
				await fetchProfiles(
					[...pendingRes.reports, ...allRes.entries],
					appealsRes.appeals,
				),
			)
		} catch (e) {
			snackbar((e as any)?.message ?? 'Failed to load the queue.')
		} finally {
			setLoading(false)
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: refresh is intentionally bound to the authed flag only
	useEffect(() => {
		if (authed) refresh().catch(() => {})
	}, [authed])

	async function login(typed: string) {
		await api.adminLogin(typed)
		sessionStorage.setItem(ADMIN_KEY, typed)
		setKey(typed)
		setAuthed(true)
	}

	function logout() {
		sessionStorage.removeItem(ADMIN_KEY)
		setKey('')
		setAuthed(false)
	}

	async function performConfirm() {
		if (!confirm) return
		setBusy(true)
		try {
			switch (confirm.kind) {
				case 'approve':
				case 'reject':
					await api.decideReport(confirm.report.id, confirm.kind, key)
					snackbar(
						confirm.kind === 'approve'
							? 'Report approved.'
							: 'Report rejected.',
					)
					break
				case 'keep':
				case 'remove':
					await api.resolveAppeal(
						confirm.appeal.id,
						confirm.kind === 'keep' ? 'kept' : 'removed',
						key,
					)
					snackbar(confirm.kind === 'remove' ? 'Entry removed.' : 'Entry kept.')
					break
				case 'delete':
					await api.deleteEntry(confirm.report.id, key)
					snackbar('Entry deleted.')
					break
			}
			setConfirm(null)
			await refresh()
			const pages = Math.max(1, Math.ceil(allTotal / PAGE_SIZE))
			if (page > pages - 1) go(allStatus, pages - 1)
		} catch (e) {
			snackbar((e as any)?.message ?? 'Action failed.')
		} finally {
			setBusy(false)
		}
	}

	const confirmState: ConfirmState | null = confirm
		? convertConfirm(confirm)
		: null

	if (!authed) {
		return <LoginCard onLogin={login} />
	}

	return (
		<>
			<div className="admin-head">
				<Tabs
					items={['Pending', 'Appeals', 'Database']}
					value={tab}
					onChange={setTab}
				/>
				<Button
					variant="text"
					icon="logout"
					onClick={logout}
					aria-label="Exit admin"
				/>
			</div>

			{loading && <Spinner />}

			{!loading && tab === 0 && (
				<>
					<span className="section-label">Awaiting review</span>
					{pending.length === 0 ? (
						<EmptyState
							icon="inbox"
							title="Queue is clear"
							text="No pending reports right now."
						/>
					) : (
						<div className="queue-grid">
							{pending.map(report => (
								<ReportCard
									key={report.id}
									report={report}
									profiles={profiles}
									onAction={action => {
										if (action === 'delete') return
										setConfirm(
											action === 'approve'
												? { kind: 'approve', report }
												: { kind: 'reject', report },
										)
									}}
								/>
							))}
						</div>
					)}
				</>
			)}

			{!loading && tab === 1 && (
				<>
					<span className="section-label">False-positive disputes</span>
					{appeals.length === 0 ? (
						<EmptyState
							icon="flag"
							title="No open appeals"
							text="Users can dispute entries from the Search tab."
						/>
					) : (
						<div className="queue-grid">
							{appeals.map(appeal => (
								<AppealCard
									key={appeal.id}
									appeal={appeal}
									profiles={profiles}
									onAction={action =>
										setConfirm(
											action === 'keep'
												? { kind: 'keep', appeal }
												: { kind: 'remove', appeal },
										)
									}
								/>
							))}
						</div>
					)}
				</>
			)}

			{!loading && tab === 2 && (
				<>
					<div className="db-toolbar">
						<fieldset className="db-filters" aria-label="Filter database">
							{STATUS_FILTERS.map(status => (
								<button
									key={status || 'all'}
									type="button"
									className={`chip${allStatus === status ? ' chip--active' : ''}`}
									onClick={() => go(status, 0)}
								>
									{status === '' ? 'All' : status}
								</button>
							))}
						</fieldset>
						<span className="section-label db-count">
							{allTotal} {allTotal === 1 ? 'entry' : 'entries'}
						</span>
					</div>

					{all.length === 0 ? (
						<EmptyState
							icon="database"
							title={allTotal ? 'Nothing on this page' : 'Database is empty'}
							text={
								allTotal
									? 'No entries match this filter on page.'
									: 'Approved reports will show up here.'
							}
						/>
					) : (
						<div className="results-list">
							{all.map(report => (
								<ReportCard
									key={report.id}
									report={report}
									profiles={profiles}
									onAction={action => {
										if (action !== 'delete') return
										setConfirm({ kind: 'delete', report })
									}}
								/>
							))}
						</div>
					)}

					{allTotal > PAGE_SIZE && (
						<div className="db-pager">
							<Button
								variant="outlined"
								icon="chevron_left"
								disabled={page === 0}
								onClick={() => go(allStatus, page - 1)}
							>
								Prev
							</Button>
							<span className="card__supporting">
								Page {page + 1} of{' '}
								{Math.max(1, Math.ceil(allTotal / PAGE_SIZE))}
							</span>
							<Button
								variant="outlined"
								icon="chevron_right"
								disabled={page >= Math.ceil(allTotal / PAGE_SIZE) - 1}
								onClick={() => go(allStatus, page + 1)}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			<ConfirmDialog
				state={confirmState}
				busy={busy}
				onConfirm={performConfirm}
				onClose={() => setConfirm(null)}
			/>
		</>
	)
}

async function fetchProfiles(
	reports: Report[],
	appeals: Appeal[],
): Promise<Record<string, DiscordUser>> {
	const ids = [
		...reports.flatMap(r => [r.mainId, r.altId]),
		...appeals.flatMap(a => [a.mainId, a.linkedAltId, a.disputerId]),
		...reports.flatMap(r => r.reporterId ?? []),
	].filter((id, i, all) => isValidSnowflake(id) && all.indexOf(id) === i)

	const results = await Promise.all(
		ids.slice(0, ADMIN_PROFILE_CAP).map(id =>
			api
				.discordProfile(id)
				.then(u => [u.id, u] as const)
				.catch(() => null),
		),
	)
	const map: Record<string, DiscordUser> = {}
	for (const result of results) {
		if (result) map[result[0]] = result[1]
	}
	return map
}

function convertConfirm(confirm: PendingConfirm): ConfirmState {
	const mono = (id: string) => <span className="mono">{id}</span>
	switch (confirm.kind) {
		case 'approve':
			return {
				title: 'Approve report',
				confirmLabel: 'Approve',
				detail: (
					<>
						This links {mono(confirm.report.mainId)} to{' '}
						{mono(confirm.report.altId)} and publishes it to everyone.
					</>
				),
			}
		case 'reject':
			return {
				title: 'Reject report',
				confirmLabel: 'Reject',
				detail: (
					<>
						The report for {mono(confirm.report.mainId)} →{' '}
						{mono(confirm.report.altId)} will be rejected and hidden.
					</>
				),
			}
		case 'keep':
			return {
				title: 'Keep entry',
				confirmLabel: 'Keep',
				detail: (
					<>The dispute will be dismissed and the entry stays published.</>
				),
			}
		case 'remove':
			return {
				title: 'Remove entry',
				confirmLabel: 'Remove',
				detail: (
					<>
						The entry will be removed from the public database and the appeal
						resolved.
					</>
				),
			}
		case 'delete':
			return {
				title: 'Delete entry',
				confirmLabel: 'Delete',
				detail: (
					<>
						This permanently deletes the entry regardless of its status.{' '}
						{mono(confirm.report.mainId)} → {mono(confirm.report.altId)}.
					</>
				),
			}
	}
}
