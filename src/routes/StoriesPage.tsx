import { Link } from 'react-router-dom'
import { ImportControls } from '../components/ImportControls'
import { logEvent } from '../observability/devLogger'

export function StoriesPage() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Stories</h1>
        <Link to="/play">Back to Play</Link>
      </header>

      <section className="tools-panel">
        <p>Story selection and import. In v1, selecting a story starts from sentence 1.</p>
        <ImportControls
          onSelect={(file) => {
            logEvent('stories', 'story_file_selected', {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            })
          }}
        />
      </section>
    </main>
  )
}
