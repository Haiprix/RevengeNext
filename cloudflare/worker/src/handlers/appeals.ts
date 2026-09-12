import { bad, isAdmin, json, notFound, readBody, unauthorized } from '../http'
import { clampText, validId } from '../validate'
import type { Route } from '../route'

interface AppealRow {
	id: number
	alt_id: number
	disputer_id: string
	reason: string
	status: string
	decision: string | null
	created_at: number
	main_id: string
	linked_alt_id: string
	warning: string
}

export const appeals: Route = async ({ url, method, request, env }) => {
	const { pathname, searchParams } = url

	const create = pathname.match(/^\/api\/alts\/(\d+)\/appeals$/)
	if (method === 'POST' && create) {
		return createAppeal(Number(create[1]), request, env.DB)
	}

	if (method === 'GET' && pathname === '/api/appeals') {
		if (!isAdmin(request, env)) return unauthorized()
		const status = searchParams.get('status') || 'open'
		const { results } = await env.DB.prepare(
			`SELECT a.id, a.alt_id, a.disputer_id, a.reason, a.status, a.decision,
			        a.created_at, al.main_id, al.alt_id AS linked_alt_id, al.warning
			   FROM appeals a
			   JOIN alts al ON al.id = a.alt_id
			  WHERE a.status = ?1
			  ORDER BY a.created_at ASC LIMIT 200`,
		)
			.bind(status)
			.all<AppealRow>()
		return json({
			appeals: results.map(toAppeal),
		})
	}

	const resolve = pathname.match(/^\/api\/appeals\/(\d+)\/resolve$/)
	if (method === 'POST' && resolve) {
		if (!isAdmin(request, env)) return unauthorized()
		const appealId = Number(resolve[1])
		const body = await readBody(request)
		const decision = body?.decision
		if (decision !== 'removed' && decision !== 'kept') {
			return bad('decision must be "removed" or "kept"')
		}
		const appeal = await env.DB.prepare(
			`SELECT id, alt_id FROM appeals WHERE id = ?1 AND status = 'open'`,
		)
			.bind(appealId)
			.first<{ id: number; alt_id: number }>()
		if (!appeal) return notFound('Appeal not found or already resolved')

		const statements: any[] = [
			env.DB.prepare(
				`UPDATE appeals
				    SET status = 'resolved', decision = ?2, resolved_at = unixepoch(), resolved_by = 'admin'
				  WHERE id = ?1`,
			).bind(appealId, decision),
		]
		if (decision === 'removed') {
			statements.push(
				env.DB.prepare(`DELETE FROM alts WHERE id = ?1`).bind(appeal.alt_id),
			)
		}
		await env.DB.batch(statements)
		return json({ ok: true, id: appealId, decision })
	}

	return null
}

async function createAppeal(
	entryId: number,
	request: Request,
	db: any,
): Promise<Response> {
	const body = await readBody(request)
	const userId = body?.userId
	if (!validId(userId)) return bad('userId must be a Discord snowflake id')
	const reason = clampText(body?.reason, 300)

	const entry = await db
		.prepare(`SELECT id FROM alts WHERE id = ?1 AND status = 'approved'`)
		.bind(entryId)
		.first()
	if (!entry) return notFound('No approved entry with that id')

	const open = await db
		.prepare(
			`SELECT id FROM appeals
			  WHERE alt_id = ?1 AND disputer_id = ?2 AND status = 'open'`,
		)
		.bind(entryId, userId)
		.first()
	if (open) {
		return json(
			{
				error: 'You already have an open request for this entry',
				duplicate: true,
			},
			409,
		)
	}

	const created = await db
		.prepare(
			`INSERT INTO appeals (alt_id, disputer_id, reason) VALUES (?1, ?2, ?3)`,
		)
		.bind(entryId, userId, reason)
		.run()
	return json({ ok: true, id: created.meta.last_row_id }, 201)
}

function toAppeal(row: AppealRow) {
	return {
		id: row.id,
		altId: row.alt_id,
		disputerId: row.disputer_id,
		reason: row.reason,
		status: row.status,
		decision: row.decision,
		createdAt: row.created_at,
		mainId: row.main_id,
		linkedAltId: row.linked_alt_id,
		warning: row.warning,
	}
}
