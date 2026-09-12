import './EmptyState.css'
import { Icon } from './Icon'

export function EmptyState({
	icon,
	title,
	text,
}: {
	icon: string
	title: string
	text?: string
}) {
	return (
		<div className="empty-state">
			<Icon name={icon} size={48} />
			<p className="empty-state__title">{title}</p>
			{text && <p className="empty-state__text">{text}</p>}
		</div>
	)
}
