import type {
	AltEntry,
	Appeal,
	DbEntry,
	DiscordUser,
	Report,
	ReportStatus,
} from './types'

const SNOWFLAKE = /^\d{15,20}$/

export function isValidSnowflake(id: string): boolean {
	return SNOWFLAKE.test(id)
}

export function formatDate(ts: number): string {
	return new Date(ts * 1000).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

async function request<T = any>(
	path: string,
	init: RequestInit = {},
	adminKey?: string,
): Promise<T> {
	const headers: Record<string, string> = {
		accept: 'application/json',
		...(init.headers as Record<string, string> | undefined),
	}
	if (/^(POST|PUT|PATCH)$/.test(init.method ?? '')) {
		headers['content-type'] = 'application/json'
	}
	if (adminKey) headers['x-altmaster-admin'] = adminKey
	const res = await fetch(`/api${path}`, { ...init, headers })
	let data: any = null
	try {
		data = await res.json()
	} catch {}
	if (!res.ok) {
		throw new Error(data?.error ?? `Request failed (${res.status})`)
	}
	return data as T
}

export const api = {
	lookup(userId: string) {
		return request<{ userId: string; entries: AltEntry[] }>(
			`/user/${encodeURIComponent(userId)}`,
		)
	},

	discordProfile(userId: string) {
		return request<DiscordUser>(`/discord/users/${encodeURIComponent(userId)}`)
	},

	report(body: {
		mainId: string
		altId: string
		warning?: string
		reporterId?: string
	}) {
		return request<{ ok: boolean; id: number }>('/reports', {
			method: 'POST',
			body: JSON.stringify(body),
		})
	},

	appeal(altId: number, body: { userId: string; reason: string }) {
		return request<{ ok: boolean; id: number }>(`/alts/${altId}/appeals`, {
			method: 'POST',
			body: JSON.stringify(body),
		})
	},

	adminLogin(password: string) {
		return request<{ ok: boolean }>('/admin/login', {
			method: 'POST',
			body: JSON.stringify({ password }),
		})
	},

	reports(status: ReportStatus | '' = 'pending', adminKey: string) {
		const q = status ? `?status=${encodeURIComponent(status)}` : ''
		return request<{ reports: Report[] }>(`/reports${q}`, {}, adminKey)
	},

	decideReport(id: number, action: 'approve' | 'reject', adminKey: string) {
		return request<{ ok: boolean }>(
			`/reports/${id}/${action}`,
			{ method: 'POST' },
			adminKey,
		)
	},

	adminEntries(
		status: ReportStatus | '',
		offset: number,
		limit: number,
		adminKey: string,
	) {
		const params = new URLSearchParams({
			offset: String(offset),
			limit: String(limit),
		})
		if (status) params.set('status', status)
		return request<{ total: number; entries: DbEntry[] }>(
			`/admin/entries?${params}`,
			{},
			adminKey,
		)
	},

	appeals(status: 'open' | 'resolved' = 'open', adminKey: string) {
		return request<{ appeals: Appeal[] }>(
			`/appeals?status=${encodeURIComponent(status)}`,
			{},
			adminKey,
		)
	},

	resolveAppeal(id: number, decision: 'removed' | 'kept', adminKey: string) {
		return request<{ ok: boolean }>(
			`/appeals/${id}/resolve`,
			{ method: 'POST', body: JSON.stringify({ decision }) },
			adminKey,
		)
	},

	deleteEntry(id: number, adminKey: string) {
		return request<{ ok: boolean }>(
			`/alts/${id}`,
			{ method: 'DELETE' },
			adminKey,
		)
	},
}
