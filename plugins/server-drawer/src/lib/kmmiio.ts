let lib: any

export function bindKmmiio(api: any): void {
	let resolved: any
	try {
		resolved = api?.unscoped?.kmmiio ?? (globalThis as any).__kmmiio
	} catch {
		resolved = (globalThis as any).__kmmiio
	}
	if (resolved != null) lib = resolved
}

// Resolved lazily so late-loaded lib plugin instances still get picked up.
export function kmmiio(): any {
	if (lib != null) return lib
	try {
		lib = (globalThis as any).__kmmiio
	} catch {
		// ignore
	}
	return lib
}
