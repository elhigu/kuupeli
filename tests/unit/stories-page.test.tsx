import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AppRoutes } from '../../src/routes/AppRoutes'
import { getProgress, saveProgress } from '../../src/db/repositories/progressRepo'
import { listTrainingPacks } from '../../src/db/repositories/trainingPackRepo'

describe('Stories page', () => {
  it('shows story management controls on /stories and not on /play', () => {
    const storiesView = render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Stories' })).toBeInTheDocument()
    expect(screen.getByLabelText(/import file/i)).toBeInTheDocument()

    storiesView.unmount()

    render(
      <MemoryRouter initialEntries={['/play']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.queryByLabelText(/import file/i)).not.toBeInTheDocument()
  })

  it('imports and removes a local story', async () => {
    const user = userEvent.setup()
    const storyName = `oma-tarina-${Date.now()}`

    render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/import file/i)
    const file = new File(['Kissa nukkuu. Koira juoksee.'], `${storyName}.txt`, { type: 'text/plain' })
    await user.upload(input, file)

    await screen.findByText(storyName)
    const removeButton = await screen.findByRole('button', { name: new RegExp(`remove ${storyName}`, 'i') })
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText(storyName)).not.toBeInTheDocument()
    })
  })

  it('rewinds and resets imported story progress', async () => {
    const user = userEvent.setup()
    const storyName = `oma-edistyminen-${Date.now()}`

    render(
      <MemoryRouter initialEntries={['/stories']}>
        <AppRoutes />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/import file/i)
    const file = new File(['Kissa nukkuu. Koira juoksee. Lintu lentaa.'], `${storyName}.txt`, { type: 'text/plain' })
    await user.upload(input, file)
    await screen.findByText(storyName)

    const story = (await listTrainingPacks()).find((pack) => pack.title === storyName)
    expect(story).toBeDefined()
    if (!story) {
      return
    }

    await saveProgress({
      packId: story.id,
      sentenceIndex: 2,
      updatedAt: new Date().toISOString()
    })

    await user.click(screen.getByRole('button', { name: new RegExp(`rewind ${storyName}`, 'i') }))
    await waitFor(async () => {
      const progress = await getProgress(story.id)
      expect(progress?.sentenceIndex).toBe(1)
    })

    await user.click(screen.getByRole('button', { name: new RegExp(`reset progress for ${storyName}`, 'i') }))
    await waitFor(async () => {
      const progress = await getProgress(story.id)
      expect(progress?.sentenceIndex ?? 0).toBe(0)
    })
  })
})
