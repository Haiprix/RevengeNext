import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './Snackbar.css'
import { Icon } from './Icon'

const SnackbarContext = createContext<(message: string) => void>(() => {})

export function useSnackbar() {
	return useContext(SnackbarContext)
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState<string | null>(null)
	const timer = useRef<number | undefined>(undefined)

	const show = (msg: string) => {
		setMessage(msg)
		window.clearTimeout(timer.current)
		timer.current = window.setTimeout(() => setMessage(null), 4000)
	}

	return (
		<SnackbarContext.Provider value={show}>
			{children}
			{message != null && (
				<div className="snackbar" role="status">
					<Icon name="check_circle" size={20} />
					<span>{message}</span>
				</div>
			)}
		</SnackbarContext.Provider>
	)
}
