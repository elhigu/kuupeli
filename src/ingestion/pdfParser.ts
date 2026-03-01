export async function parsePdfFile(file: File): Promise<string> {
  // Placeholder implementation for v1 scaffolding; full PDF extraction lands in later task work.
  const bytes = await file.arrayBuffer()
  return new TextDecoder().decode(bytes)
}
