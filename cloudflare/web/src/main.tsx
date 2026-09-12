import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { SnackbarProvider } from './components/ui'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<SnackbarProvider>
			<App />
		</SnackbarProvider>
	</StrictMode>,
)
