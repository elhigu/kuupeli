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
            onSelect(file)
          }
        }}
      />
    </label>
  )
}
