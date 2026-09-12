let toastCounter = 0

export function showToast(message: string) {
	try {
		const creator = (revenge as any).discord?.actions?.ToastActionCreators
		if (typeof creator?.open !== 'function') return
		toastCounter += 1
		creator.open({
			key: `altmaster-toast-${toastCounter}`,
			content: message,
		})
	} catch {}
}

export function showInfo(title: string, message: string): void {
	showToast(`${title}: ${message}`)
}

export function showError(title: string, message: string): void {
	showToast(`${title}: ${message}`)
}
