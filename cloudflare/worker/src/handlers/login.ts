import { isAdmin, json, readBody, unauthorized } from '../http'
import type { Route } from '../route'

export const login: Route = async ({ url, method, request, env }) => {
	if (method !== 'POST' || url.pathname !== '/api/admin/login') return null
	const body = await readBody(request)
	if (isAdmin(request, env) || body?.password === env?.ADMIN_PASSWORD) {
		return json({ ok: true })
	}
	return unauthorized()
}
