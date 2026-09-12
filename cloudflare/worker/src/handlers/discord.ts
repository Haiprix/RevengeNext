import { bad, json, notFound } from '../http'
import { validId } from '../validate'
import type { Route } from '../route'

const DISCORD_API = 'https://discord.com/api/v10'
const CACHE_TTL = 300

interface UpstreamUser {
	id?: string
	username?: string
	global_name?: string | null
	discriminator?: string
	avatar?: string | null
	banner?: string | null
	accent_color?: number | null
	bot?: boolean
}

function cacheKey(id: string): Request {
	return new Request(
		`https://altmaster.kmmiio99o.workers.dev/discord-cache/users/${id}`,
		{ method: 'GET' },
	)
}

export const discordProfile: Route = async ({ url, method, env }) => {
	if (method !== 'GET') return null
	const match = url.pathname.match(/^\/api\/discord\/users\/(\d+)$/)
	if (!match) return null

	const id = match[1]
	if (!validId(id)) return bad('Invalid Discord snowflake id')

	if (!env?.DISCORD_TOKEN) {
		return json(
			{ error: 'Profiles are not configured', code: 'discord_not_configured' },
			501,
		)
	}

	const cache = caches.default
	const cached = await cache.match(cacheKey(id))
	if (cached) return cached

	let upstream: Response
	try {
		upstream = await fetch(`${DISCORD_API}/users/${id}`, {
			headers: {
				authorization: `Bot ${env.DISCORD_TOKEN}`,
				'user-agent': 'AltMaster (https://altmaster.kmmiio99o.workers.dev)',
			},
		})
	} catch {
		return json({ error: 'Discord lookup failed' }, 502)
	}

	if (upstream.status === 429) {
		const retryAfter = upstream.headers.get('retry-after') ?? '1'
		return json(
			{ error: 'Discord rate limit reached', retry: Number(retryAfter) },
			429,
		)
	}

	if (upstream.status === 401 || upstream.status === 403) {
		return json({ error: 'Discord token rejected' }, 502)
	}

	if (upstream.status === 404) {
		return notFound('Unknown user')
	}

	if (!upstream.ok) {
		return json({ error: 'Discord lookup failed' }, 502)
	}

	const user = (await upstream.json().catch(() => null)) as UpstreamUser | null
	if (!user || typeof user.id !== 'string') {
		return json({ error: 'Discord returned an unexpected response' }, 502)
	}

	const avatar = typeof user.avatar === 'string' ? user.avatar : null
	const payload = {
		id: user.id,
		username: typeof user.username === 'string' ? user.username : 'unknown',
		displayName:
			typeof user.global_name === 'string' && user.global_name.length > 0
				? user.global_name
				: user.username,
		discriminator:
			typeof user.discriminator === 'string' && user.discriminator !== '0'
				? user.discriminator
				: null,
		avatar,
		animatedAvatar: avatar?.startsWith('a_') ?? false,
		banner: typeof user.banner === 'string' ? user.banner : null,
		bot: user.bot ?? false,
	}

	const response = json(payload, 200, {
		'cache-control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
	})
	await cache.put(cacheKey(id), response.clone())
	return response
}
