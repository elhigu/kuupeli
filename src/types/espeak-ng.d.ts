declare module 'espeak-ng' {
  interface ESpeakModule {
    FS: {
      readFile(path: string): Uint8Array
    }
  }

  interface ESpeakFactoryOptions {
    arguments?: string[]
  }

  export default function ESpeakNg(options?: ESpeakFactoryOptions): Promise<ESpeakModule>
}
