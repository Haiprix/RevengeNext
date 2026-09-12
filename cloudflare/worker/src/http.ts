export const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'content-type, x-altmaster-admin',
}

export function json(
	data: unknown,
	status = 200,
	extra: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...cors,
			...extra,
		},
	})
}

export function bad(message: string): Response {
	return json({ error: message }, 400)
}

export function notFound(message = 'Not found'): Response {
	return json({ error: message }, 404)
}

export function unauthorized(message = 'Invalid admin password'): Response {
	return json({ error: message }, 401)
}

export async function readBody(request: Request): Promise<any> {
	try {
		return await request.json()
	} catch {
		return null
	}
}

export function isAdmin(request: Request, env: any): boolean {
	return request.headers.get('x-altmaster-admin') === env?.ADMIN_PASSWORD
}
