const PREFIX = '[SILENT-EDIT]'

export function dbg(tag: string, message: string, data?: any): void {
	try {
		const detail = data === undefined ? '' : ` ${safe(data)}`
		console.warn(`${PREFIX}[${tag}] ${message}${detail}`)
	} catch {}
}

function safe(v: any): string {
	try {
		if (v instanceof Error) return `${v.message}${v.stack ? `\n${v.stack}` : ''}`
		const s = JSON.stringify(v)
		return s === undefined ? String(v) : s
	} catch {
		return String(v)
	}
}
