import { bad, json } from '../http'
import { validId } from '../validate'
import type { Route } from '../route'

interface Row {
	id: number
	main_id: string
	alt_id: string
	warning: string
	created_at: number
}

export const lookupUser: Route = async ({ url, method, env }) => {
	const match = url.pathname.match(/^\/api\/user\/([^/]+)$/)
	if (method !== 'GET' || !match) return null

	const userId = decodeURIComponent(match[1])
	if (!validId(userId)) return bad('UserId must be a Discord snowflake id')

	const { results } = await env.DB.prepare(
		`SELECT id, main_id, alt_id, warning, created_at
		   FROM alts
		  WHERE status = 'approved' AND (main_id = ?1 OR alt_id = ?1)
		  ORDER BY created_at DESC`,
	)
		.bind(userId)
		.all<Row>()

	return json({
		userId,
		entries: results.map(row => ({
			id: row.id,
			mainId: row.main_id,
			altId: row.alt_id,
			warning: row.warning,
			createdAt: row.created_at,
		})),
	})
}
