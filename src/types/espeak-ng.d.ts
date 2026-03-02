declare module 'espeak-ng' {
  interface ESpeakModule {
    FS: {
      readFile(path: string): Uint8Array
    }
  }

  interface ESpeakFactoryOptions {
    arguments?: string[]
    locateFile?: (path: string, prefix: string) => string
    print?: (...args: unknown[]) => void
    printErr?: (...args: unknown[]) => void
  }

  export default function ESpeakNg(options?: ESpeakFactoryOptions): Promise<ESpeakModule>
}
