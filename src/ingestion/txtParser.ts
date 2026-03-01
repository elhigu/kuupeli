export async function parseTxtFile(file: File): Promise<string> {
  return file.text()
}
