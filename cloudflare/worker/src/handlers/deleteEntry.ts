import { isAdmin, json, notFound, unauthorized } from '../http'
import type { Route } from '../route'

export const deleteEntry: Route = async ({ url, method, request, env }) => {
	const match = url.pathname.match(/^\/api\/alts\/(\d+)$/)
	if (method !== 'DELETE' || !match) return null
	if (!isAdmin(request, env)) return unauthorized()

	const id = Number(match[1])
	const result = await env.DB.prepare(`DELETE FROM alts WHERE id = ?1`)
		.bind(id)
		.run()
	if (!result.meta.changes) return notFound('Entry not found')
	return json({ ok: true, id })
}
