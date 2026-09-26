import { KmmiioLib } from './lib/api'
import * as Log from './lib/log'
import * as Modules from './lib/modules'
import Settings from './ui/Settings'

export default plugin({
	start({ decorate }) {
		// Logs every native call with the calling plugin attached. Installed here
		// rather than at module load so the patch happens once, on a live api.
		const native = (revenge as any).modules?.native
		if (native && typeof native.callNativeMethod === 'function') {
			const original = native.callNativeMethod
			native.callNativeMethod = function patchedNative(
				method: string,
				args: any[],
			) {
				const caller = Modules.getActivePluginId?.() ?? 'unknown'
				let found = true
				let result: any
				try {
					result = original.call(this, method, args)
				} catch {
					found = false
				}
				Log.addLog({
					id: caller,
					module: 'native',
					action: method,
					attempt: 1,
					found,
				})
				return result
			}
		}

		decorate(plugin => {
			plugin.api.unscoped.kmmiio = KmmiioLib
		})
	},
	SettingsComponent: Settings,
})

type KmmiioLibApi = typeof KmmiioLib

declare module '@revenge-mod/plugins/types' {
	interface UnscopedPluginApi {
		kmmiio: KmmiioLibApi
	}
}
