import { bad, isAdmin, json, notFound, readBody, unauthorized } from '../http'
import { clampText, validId } from '../validate'
import type { Route } from '../route'

interface ReportRow {
	id: number
	main_id: string
	alt_id: string
	warning: string
	reporter_id: string | null
	status: string
	created_at: number
}

export const reports: Route = async ({ url, method, request, env }) => {
	const { pathname, searchParams } = url

	if (method === 'POST' && pathname === '/api/reports') {
		return submitReport(request, env.DB)
	}

	if (method === 'GET' && pathname === '/api/reports') {
		if (!isAdmin(request, env)) return unauthorized()
		const status = searchParams.get('status')
		if (status) {
			const { results } = await env.DB.prepare(
				`SELECT id, main_id, alt_id, warning, reporter_id, status, created_at
				   FROM alts
				  WHERE status = ?1
				  ORDER BY created_at DESC LIMIT 200`,
			)
				.bind(status)
				.all<ReportRow>()
			return json({ reports: results.map(toReport) })
		}
		const { results } = await env.DB.prepare(
			`SELECT id, main_id, alt_id, warning, reporter_id, status, created_at
			   FROM alts
			  ORDER BY created_at DESC LIMIT 500`,
		).all<ReportRow>()
		return json({ reports: results.map(toReport) })
	}

	const action = pathname.match(/^\/api\/reports\/(\d+)\/(approve|reject)$/)
	if (method === 'POST' && action) {
		if (!isAdmin(request, env)) return unauthorized()
		const id = Number(action[1])
		const status = action[2] === 'approve' ? 'approved' : 'rejected'
		const result = await env.DB.prepare(
			`UPDATE alts
			    SET status = ?2, decided_at = unixepoch(), decided_by = 'admin'
			  WHERE id = ?1 AND status = 'pending'`,
		)
			.bind(id, status)
			.run()
		if (!result.meta.changes) {
			return notFound('Report not found or already decided')
		}
		return json({ ok: true, id, status })
	}

	return null
}

async function submitReport(request: Request, db: any): Promise<Response> {
	const body = await readBody(request)
	const mainId = body?.mainId
	const altId = body?.altId
	if (!validId(mainId)) return bad('mainId must be a Discord snowflake id')
	if (!validId(altId)) return bad('altId must be a Discord snowflake id')
	if (mainId === altId) return bad('A user cannot be their own alt')
	const warning = clampText(body?.warning, 200)
	const reporterId = validId(body?.reporterId) ? body.reporterId : null

	try {
		const created = await db
			.prepare(
				`INSERT INTO alts (main_id, alt_id, warning, reporter_id)
				 VALUES (?1, ?2, ?3, ?4)`,
			)
			.bind(mainId, altId, warning, reporterId)
			.run()
		return json({ ok: true, id: created.meta.last_row_id }, 201)
	} catch {
		const existing = await db
			.prepare(`SELECT id, status FROM alts WHERE main_id = ?1 AND alt_id = ?2`)
			.bind(mainId, altId)
			.first()
		if (existing) {
			return json(
				{
					error: 'This pair is already known',
					duplicate: true,
					status: existing.status,
				},
				409,
			)
		}
		return bad('Failed to store the report')
	}
}

function toReport(row: ReportRow) {
	return {
		id: row.id,
		mainId: row.main_id,
		altId: row.alt_id,
		warning: row.warning,
		reporterId: row.reporter_id,
		status: row.status,
		createdAt: row.created_at,
	}
}
