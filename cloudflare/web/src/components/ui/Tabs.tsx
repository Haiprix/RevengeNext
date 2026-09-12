import './Tabs.css'

export function Tabs({
	items,
	value,
	onChange,
}: {
	items: string[]
	value: number
	onChange: (index: number) => void
}) {
	return (
		<div className="tabs" role="tablist">
			{items.map((item, i) => (
				<button
					key={item}
					type="button"
					className={`tabs__tab${i === value ? ' tabs__tab--active' : ''}`}
					role="tab"
					aria-selected={i === value}
					onClick={() => onChange(i)}
				>
					{item}
				</button>
			))}
		</div>
	)
}
