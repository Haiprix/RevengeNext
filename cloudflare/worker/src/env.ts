import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
	DB: D1Database
	ADMIN_PASSWORD: string
	DISCORD_TOKEN?: string
	ASSETS?: {
		fetch(request: Request): Promise<Response>
	}
}
