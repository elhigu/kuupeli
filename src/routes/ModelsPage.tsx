import { Link } from 'react-router-dom'
import { ModelManagerPanel } from '../components/ModelManagerPanel'

export function ModelsPage() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Models</h1>
        <Link to="/play">Back to Play</Link>
      </header>

      <section className="tools-panel">
        <ModelManagerPanel />
      </section>
    </main>
  )
}
