interface SubmitButtonProps {
  disabled?: boolean
  onSubmit: () => void
}

export function SubmitButton({ disabled = false, onSubmit }: SubmitButtonProps) {
  return (
    <button type="button" onClick={onSubmit} disabled={disabled} aria-label="Submit">
      Submit
    </button>
  )
}
