import { dbg } from './log'
import { onImportedPath } from './modules'
import { clearPending, getSettings, isPending } from './state'

let restApi: any

/**
 * Replaces Discord's editMessage: instead of a real edit, post the new text as
 * a fresh message (same nonce/flags/reply) and delete the old one.
 */
export function patchSilentEdit(): () => void {
	const unpatch: Array<() => void> = []

	// NOTE: 'lib/RestAPI.tsx' is my best guess for the module path. The log
	// below tells you whether it was found. See the notes in the chat.
	unpatch.push(
		onImportedPath('lib/RestAPI.tsx', (ns: any) => {
			restApi = ns?.default ?? ns
			dbg(
				'rest',
				restApi?.get && restApi?.post && restApi?.del
					? 'RestAPI found'
					: 'RestAPI NOT usable',
				Object.keys(restApi ?? {}).slice(0, 12),
			)
		}),
	)

	unpatch.push(
		onImportedPath('actions/MessageActionCreators.tsx', (ns: any) => {
			const creators = ns?.default ?? ns
			if (typeof creators?.editMessage !== 'function') return

			unpatch.push(
				revenge.patcher.instead(
					creators,
					'editMessage',
					async (args: any[], orig: any) => {
						const [channelId, messageId, reqData] = args

						if (!getSettings().overrideNative && !isPending(messageId)) {
							return orig(...args)
						}
						clearPending()

						if (!restApi?.get || !restApi?.post || !restApi?.del) {
							dbg('edit', 'RestAPI missing, falling back to normal edit')
							return orig(...args)
						}

						try {
							const res = await restApi.get({
								url: `/channels/${channelId}/messages`,
								query: { limit: 1, around: messageId },
							})
							const msg = res?.body?.find?.((m: any) => m.id === messageId)
							if (!msg) return orig(...args)

							// ".filename <uploaded_filename>" in the text re-attaches files
							let content: string = reqData.content
							const regex = /\.filename\s+(\S+)/g
							const matches = [...content.matchAll(regex)].slice(0, 10)
							let attachments: any[] | undefined

							if (matches.length > 0) {
								attachments = matches.map((m, i) => ({
									id: String(i),
									filename: m[1].split('/').pop() || 'image.png',
									uploaded_filename: m[1],
								}))
								content = content.replace(regex, '').trim()
							}

							const body: any = {
								content,
								nonce: messageId,
								tts: false,
								flags: msg.flags ?? 0,
								mobile_network_type: 'wifi',
							}
							if (attachments) body.attachments = attachments

							if (msg.message_reference) {
								body.message_reference = {
									message_id: msg.message_reference.message_id,
									channel_id: msg.message_reference.channel_id,
									guild_id: msg.message_reference.guild_id,
								}
								const repliedUser = msg.referenced_message?.author?.id
								const hasPing = repliedUser
									? msg.mentions?.some((u: any) => u.id === repliedUser)
									: false
								body.allowed_mentions = {
									replied_user: hasPing,
									parse: ['users', 'roles', 'everyone'],
								}
							}

							const response = await restApi.post({
								url: `/channels/${channelId}/messages`,
								body,
							})
							await restApi.del({
								url: `/channels/${channelId}/messages/${messageId}`,
							})
							return response
						} catch (err: any) {
							dbg('edit', 'silent edit failed, normal edit instead', err)
							return orig(...args)
						}
					},
				),
			)
		}),
	)

	return () => {
		for (const u of unpatch) u?.()
		clearPending()
	}
}
