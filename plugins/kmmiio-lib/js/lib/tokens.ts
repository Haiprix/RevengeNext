type CompactTokens = {
	colors: Record<string, any>
	unsafe_rawColors: Record<string, string>
	internal: {
		resolveSemanticColor: (
			theme: string,
			semObj: any,
		) => string | number | undefined
	}
}

let tokenModule: CompactTokens | undefined

export function getTokens(): CompactTokens | undefined {
	if (tokenModule !== undefined) return tokenModule
	try {
		const { lookupModule } = revenge.modules.finders
		const { withProps } = revenge.modules.finders.filters
		const [exports] = lookupModule(
			withProps('colors', 'unsafe_rawColors', 'internal'),
			{ cached: false },
		)
		if (
			exports != null &&
			typeof exports.colors === 'object' &&
			exports.colors !== null &&
			typeof exports.unsafe_rawColors === 'object' &&
			exports.unsafe_rawColors !== null &&
			typeof exports.internal?.resolveSemanticColor === 'function'
		) {
			tokenModule = exports
		}
	} catch {}
	return tokenModule
}

export function getTheme(): string {
	try {
		const theme = (revenge.discord.flux.Stores as any).ThemeStore?.theme
		if (
			theme === 'light' ||
			theme === 'dark' ||
			theme === 'midnight' ||
			theme === 'darker'
		) {
			return theme
		}
	} catch {}
	return 'dark'
}

function toHex(result: any): string | undefined {
	if (typeof result === 'string' && result.startsWith('#')) return result
	if (typeof result === 'number') {
		return '#' + (result >>> 0).toString(16).padStart(8, '0').slice(2)
	}
	return undefined
}

export function resolveColor(semToken: string): string | undefined {
	try {
		const tokens = getTokens()
		if (!tokens) return undefined
		const semObj = tokens.colors?.[semToken]
		if (!semObj) return undefined
		const theme = getTheme()
		return toHex(tokens.internal.resolveSemanticColor(theme, semObj))
	} catch {}
	return undefined
}

export function rawColor(name: string): string | undefined {
	try {
		const raw = getTokens()?.unsafe_rawColors?.[name]
		if (typeof raw === 'string' && raw.startsWith('#')) return raw
	} catch {}
	return undefined
}
