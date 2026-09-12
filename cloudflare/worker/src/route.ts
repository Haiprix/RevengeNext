import type { Env } from './env'

export interface RouteContext {
	request: Request
	url: URL
	method: string
	env: Env
}

export type Route = (
	ctx: RouteContext,
) => Response | null | Promise<Response | null>
