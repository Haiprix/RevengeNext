#!/usr/bin/env bun

import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const secret = process.env.MESSAGE_TWEAKS_PASSKEY ?? ''

const hash = secret ? createHash('sha256').update(secret).digest('hex') : ''

writeFileSync(
	join(ROOT, 'plugins', 'message-tweaks', 'secret.ts'),
	`export default {\n\tpasskeyHash: '${hash}',\n}\n`,
)

console.log(
	hash
		? `Wrote plugins/message-tweaks/secret.ts (passkeyHash: ${hash.slice(0, 12)}…)`
		: `Wrote plugins/message-tweaks/secret.ts (empty — the Local settings page is fully LOCKED DOWN)`,
)
