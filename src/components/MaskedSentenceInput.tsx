interface MaskedSentenceInputProps {
  sentence: string
}

export function MaskedSentenceInput({ sentence }: MaskedSentenceInputProps) {
  const masked = sentence.replace(/[A-Za-zÅÄÖåäö]/g, '_')

  return (
    <div aria-label="masked sentence" className="masked-sentence" data-testid="masked-sentence">
      {Array.from(masked).map((char, index) => (
        <span key={`${char}-${index}`}>{char === ' ' ? '\u00A0' : char}</span>
      ))}
    </div>
  )
}
