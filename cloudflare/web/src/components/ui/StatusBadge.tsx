import './StatusBadge.css'

export function StatusBadge({ status }: { status: string }) {
	return <span className={`badge badge--${status}`}>{status}</span>
}
