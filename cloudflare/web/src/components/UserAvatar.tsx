import { useState } from 'react'
import './UserAvatar.css'

export function defaultAvatarUrl(id: string): string {
	let index = 0
	try {
		index = Math.abs(Number((BigInt(id) >> 22n) % 6n))
	} catch {}
	return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

const DISCORD_AVATAR_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048]

function nearestSize(size: number): number {
	for (const s of DISCORD_AVATAR_SIZES) {
		if (s >= size) return s
	}
	return 2048
}

export function avatarUrl(
	id: string,
	hash: string | null | undefined,
	size = 96,
): string | null {
	if (!hash) return null
	const extension = hash.startsWith('a_') ? 'gif' : 'png'
	return `https://cdn.discordapp.com/avatars/${id}/${hash}.${extension}?size=${nearestSize(size)}`
}

export function snowflakeCreatedAt(id: string): Date | null {
	try {
		const ms = Number((BigInt(id) >> 22n) + 1420070400000n)
		if (!Number.isFinite(ms) || ms <= 0) return null
		return new Date(ms)
	} catch {
		return null
	}
}

export function shortId(id: string): string {
	return id.length > 6 ? `…${id.slice(-6)}` : id
}

export function profileHref(id: string): string {
	return `https://discord.com/users/${id}`
}

export function UserAvatar({
	id,
	hash,
	size = 96,
	name,
}: {
	id: string
	hash?: string | null
	size?: number
	name?: string
}) {
	const [broken, setBroken] = useState(false)
	const src = broken
		? defaultAvatarUrl(id)
		: (avatarUrl(id, hash, size) ?? defaultAvatarUrl(id))
	return (
		<img
			className={`user-avatar${hash == null || broken ? ' user-avatar--default' : ''}`}
			style={{ width: size, height: size }}
			src={src}
			alt={name ?? id}
			loading="lazy"
			onError={() => setBroken(true)}
		/>
	)
}
