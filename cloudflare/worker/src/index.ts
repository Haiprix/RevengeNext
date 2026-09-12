import { appeals } from './handlers/appeals'
import { deleteEntry } from './handlers/deleteEntry'
import { discordProfile } from './handlers/discord'
import { entries } from './handlers/entries'
import { health } from './handlers/health'
import { login } from './handlers/login'
import { reports } from './handlers/reports'
import { lookupUser } from './handlers/user'
import { cors, notFound } from './http'
import type { Env } from './env'
import type { Route } from './route'

const routes: Route[] = [
	health,
	login,
	discordProfile,
	lookupUser,
	reports,
	appeals,
	entries,
	deleteEntry,
]

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: cors })
		}

		for (const route of routes) {
			const response = await route({
				request,
				url,
				method: request.method,
				env,
			})
			if (response) return response
		}

		if (env?.ASSETS?.fetch) {
			return env.ASSETS.fetch(request)
		}

		return notFound()
	},
} as const
