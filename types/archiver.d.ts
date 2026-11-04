declare module 'archiver' {
  import type { Readable } from 'node:stream';

  interface Archive extends Readable {
    file(path: string, options: { name: string }): this;
    finalize(): Promise<void> | void;
  }

  function archiver(format: string, options?: Record<string, unknown>): Archive;
  export default archiver;
}
