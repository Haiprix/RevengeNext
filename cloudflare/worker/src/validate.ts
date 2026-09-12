const SNOWFLAKE = /^\d{15,20}$/

export function validId(value: unknown): boolean {
	return typeof value === 'string' && SNOWFLAKE.test(value)
}

export function clampText(value: unknown, max: number): string {
	if (typeof value !== 'string') return ''
	return value.slice(0, max)
}
