export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'removed'

export interface DiscordUser {
	id: string
	username: string
	displayName: string
	discriminator: string | null
	avatar: string | null
	animatedAvatar: boolean
	banner: string | null
	bot: boolean
}

export interface AltEntry {
	id: number
	mainId: string
	altId: string
	warning: string
	createdAt: number
}

export interface Report {
	id: number
	mainId: string
	altId: string
	warning: string
	reporterId: string | null
	status: ReportStatus
	createdAt: number
}

export interface DbEntry extends Report {
	decidedAt: number | null
	decidedBy: string | null
}

export interface Appeal {
	id: number
	altId: number
	disputerId: string
	reason: string
	status: 'open' | 'resolved'
	decision: 'removed' | 'kept' | null
	createdAt: number
	mainId: string
	linkedAltId: string
	warning: string
}
