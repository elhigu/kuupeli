import { logEvent } from '../observability/devLogger'

interface ImportControlsProps {
  onSelect: (file: File) => void
}

export function ImportControls({ onSelect }: ImportControlsProps) {
  return (
    <label>
      <span>Import File</span>
      <input
        aria-label="Import File"
        type="file"
        accept=".txt,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            logEvent('ingestion', 'import_control_selected', {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            })
            onSelect(file)
            return
          }

          logEvent('ingestion', 'import_control_empty_selection')
        }}
      />
    </label>
  )
}
