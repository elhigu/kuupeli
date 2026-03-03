interface StartModalProps {
  onStart: () => void
}

export function StartModal({ onStart }: StartModalProps) {
  return (
    <div className="start-modal" role="dialog" aria-modal="true" aria-labelledby="start-modal-title">
      <div className="start-modal-card">
        <h2 id="start-modal-title">Oletko valmis ensimmäiseen lauseeseen?</h2>
        <button type="button" className="start-modal-button" onClick={onStart}>
          Aloita
        </button>
      </div>
    </div>
  )
}
