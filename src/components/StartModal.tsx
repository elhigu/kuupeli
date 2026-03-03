interface StartModalStoryOption {
  id: string
  title: string
  sentenceCount: number
  resumeIndex: number
}

interface StartModalProps {
  stories: StartModalStoryOption[]
  selectedStoryId: string
  onSelectStory: (storyId: string) => void
  onStart: () => void
}

function clampResumePosition(sentenceCount: number, resumeIndex: number): number {
  if (sentenceCount <= 0) {
    return 0
  }

  return Math.max(0, Math.min(resumeIndex, sentenceCount - 1))
}

export function StartModal({ stories, selectedStoryId, onSelectStory, onStart }: StartModalProps) {
  return (
    <div className="start-modal" role="dialog" aria-modal="true" aria-labelledby="start-modal-title">
      <div className="start-modal-card">
        <h2 id="start-modal-title">Oletko valmis ensimmäiseen lauseeseen?</h2>
        <fieldset className="start-modal-story-list" aria-label="Story selection">
          {stories.map((story) => {
            const resumePosition = clampResumePosition(story.sentenceCount, story.resumeIndex)
            return (
              <label key={story.id} className="start-modal-story-option">
                <input
                  type="radio"
                  name="start-modal-story"
                  checked={selectedStoryId === story.id}
                  onChange={() => {
                    onSelectStory(story.id)
                  }}
                />
                <span>
                  {story.title} ({resumePosition + 1}/{story.sentenceCount})
                </span>
              </label>
            )
          })}
        </fieldset>
        <button type="button" className="start-modal-button" onClick={onStart}>
          Aloita
        </button>
      </div>
    </div>
  )
}
