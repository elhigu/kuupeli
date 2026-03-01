interface StorageErrorBannerProps {
  message: string
}

export function StorageErrorBanner({ message }: StorageErrorBannerProps) {
  if (!message) {
    return null
  }

  return (
    <aside role="alert" aria-live="assertive">
      Storage issue: {message}
    </aside>
  )
}
