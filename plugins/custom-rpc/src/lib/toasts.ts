export function showToast(content: string, icon?: string) {
	const { ToastActionCreators } = revenge.discord.actions
	ToastActionCreators.open({
		key: `custom-rpc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		content,
		icon: icon ? revenge.assets.getAssetIdByName(icon) : undefined,
	})
}
