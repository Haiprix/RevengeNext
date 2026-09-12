import { bad, isAdmin, json, unauthorized } from '../http'
import type { Route } from '../route'

interface Row {
	id: number
	main_id: string
	alt_id: string
	warning: string
	reporter_id: string | null
	status: string
	created_at: number
	decided_at: number | null
	decided_by: string | null
}

const STATUSES = new Set(['pending', 'approved', 'rejected', 'removed'])
const MAX_LIMIT = 500

export const entries: Route = async ({ url, method, request, env }) => {
	const { pathname, searchParams } = url

	if (method !== 'GET' || pathname !== '/api/admin/entries') return null
	if (!isAdmin(request, env)) return unauthorized()

	const status = searchParams.get('status') ?? ''
	if (status && !STATUSES.has(status)) return bad(`invalid status: ${status}`)

	const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
	const limit = Math.min(
		MAX_LIMIT,
		Math.max(1, Number(searchParams.get('limit') ?? 100) || 100),
	)

	const { results } = await env.DB.prepare(
		`SELECT id, main_id, alt_id, warning, reporter_id, status,
		        created_at, decided_at, decided_by
		   FROM alts
		  WHERE (?1 IS NULL OR status = ?1)
		  ORDER BY created_at DESC, id DESC
		  LIMIT ?2 OFFSET ?3`,
	)
		.bind(status || null, limit, offset)
		.all<Row>()
	const total = await env.DB.prepare(
		`SELECT COUNT(*) AS n
		   FROM alts
		  WHERE (?1 IS NULL OR status = ?1)`,
	)
		.bind(status || null)
		.first<{ n: number }>()

	return json({
		total: total?.n ?? 0,
		entries: results.map(row => ({
			id: row.id,
			mainId: row.main_id,
			altId: row.alt_id,
			warning: row.warning,
			reporterId: row.reporter_id,
			status: row.status,
			createdAt: row.created_at,
			decidedAt: row.decided_at,
			decidedBy: row.decided_by,
		})),
	})
}