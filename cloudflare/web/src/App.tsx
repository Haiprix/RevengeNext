import { useEffect, useRef, useState } from 'react'
import { Icon } from './components/ui'
import { AdminPage } from './pages/AdminPage'
import { ReportPage } from './pages/ReportPage'
import { SearchPage } from './pages/SearchPage'
import type { MouseEvent } from 'react'

const TABS = [
	{ id: 'search', label: 'Search', icon: 'manage_search' },
	{ id: 'report', label: 'Report', icon: 'add_circle' },
	{ id: 'admin', label: 'Admin', icon: 'shield' },
]

const SIDEBAR_MIN = 220
const SIDEBAR_MAX = 460
const SIDEBAR_DEFAULT = 248
const SIDEBAR_KEY = 'altmaster.sidebar'

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function tabFromHash(): number {
	const id = window.location.hash.replace(/^#\/?/, '')
	const index = TABS.findIndex(t => t.id === id)
	return index === -1 ? 0 : index
}

export default function App() {
	const [tab, setTab] = useState(tabFromHash)
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		try {
			const saved = Number(localStorage.getItem(SIDEBAR_KEY))
			if (
				Number.isFinite(saved) &&
				saved >= SIDEBAR_MIN &&
				saved <= SIDEBAR_MAX
			) {
				return saved
			}
		} catch {}
		return SIDEBAR_DEFAULT
	})
	const [resizing, setResizing] = useState(false)
	const widthRef = useRef(sidebarWidth)

	useEffect(() => {
		widthRef.current = sidebarWidth
	}, [sidebarWidth])

	useEffect(() => {
		const onHash = () => setTab(tabFromHash())
		window.addEventListener('hashchange', onHash)
		return () => window.removeEventListener('hashchange', onHash)
	}, [])

	function changeTab(index: number) {
		setTab(index)
		window.location.hash = `/${TABS[index].id}`
	}

	function startResize(e: MouseEvent) {
		e.preventDefault()
		const startX = e.clientX
		const startWidth = widthRef.current
		setResizing(true)
		document.body.classList.add('sidebar-dragging')

		const onMove = (event: globalThis.MouseEvent) => {
			setSidebarWidth(
				clamp(startWidth + (event.clientX - startX), SIDEBAR_MIN, SIDEBAR_MAX),
			)
		}
		const onUp = () => {
			setResizing(false)
			document.body.classList.remove('sidebar-dragging')
			try {
				localStorage.setItem(SIDEBAR_KEY, String(widthRef.current))
			} catch {}
			document.removeEventListener('mousemove', onMove)
			document.removeEventListener('mouseup', onUp)
		}

		document.addEventListener('mousemove', onMove)
		document.addEventListener('mouseup', onUp)
	}

	return (
		<div className="app">
			<aside
				className="sidebar"
				style={{ width: sidebarWidth, flexBasis: sidebarWidth }}
			>
				<div className="sidebar__brand">
					<div className="sidebar__name">AltMaster</div>
					<div className="sidebar__tagline">alt-account database</div>
				</div>

				<hr
					className={`sidebar__resizer${resizing ? ' sidebar__resizer--active' : ''}`}
					onMouseDown={startResize}
					aria-orientation="vertical"
					aria-label="Resize sidebar"
				/>

				<nav className="sidebar__nav" aria-label="Sections">
					{TABS.map((item, i) => (
						<button
							key={item.id}
							type="button"
							className={`sidebar__item${tab === i ? ' sidebar__item--active' : ''}`}
							onClick={() => changeTab(i)}
							aria-current={tab === i ? 'page' : undefined}
						>
							<Icon name={item.icon} size={22} filled={tab === i} />
							<span>{item.label}</span>
						</button>
					))}
				</nav>

				<p className="sidebar__foot">
					Reports are reviewed by moderators before they go public.
				</p>
			</aside>

			<div className="app__body">
				<main className="app__main" key={tab}>
					{tab === 0 && <SearchPage />}
					{tab === 1 && <ReportPage />}
					{tab === 2 && <AdminPage />}
				</main>
			</div>

			<nav className="nav-bar" aria-label="Sections">
				{TABS.map((item, i) => (
					<button
						key={item.id}
						type="button"
						className={`nav-bar__item${tab === i ? ' nav-bar__item--active' : ''}`}
						onClick={() => changeTab(i)}
						aria-current={tab === i ? 'page' : undefined}
					>
						<span className="nav-bar__pill">
							<Icon name={item.icon} size={24} filled={tab === i} />
						</span>
						<span>{item.label}</span>
					</button>
				))}
			</nav>
		</div>
	)
}
