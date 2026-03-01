interface ReplayButtonProps {
  onReplay: () => void
}

export function ReplayButton({ onReplay }: ReplayButtonProps) {
  return (
    <button type="button" onClick={onReplay} aria-label="Replay">
      Replay
    </button>
  )
}
