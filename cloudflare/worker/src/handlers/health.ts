import { json } from '../http'
import type { Route } from '../route'

export const health: Route = ({ url, method }) => {
	if (method !== 'GET' || url.pathname !== '/api/health') return null
	return json({ ok: true, service: 'altmaster', time: Date.now() })
}
