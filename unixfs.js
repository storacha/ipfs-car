/* eslint-env browser */
import * as UnixFS from '@ipld/unixfs'
import * as raw from 'multiformats/codecs/raw'

const SHARD_THRESHOLD = 1000 // shard directory after > 1,000 items
const queuingStrategy = UnixFS.withCapacity()

const defaultSettings = UnixFS.configure({
  fileChunkEncoder: raw,
  smallFileEncoder: raw
})

/**
 * @param {import('./types').BlobLike} blob
 * @param {UnixFS.EncoderSettings} [settings]
 * @returns {ReadableStream<import('@ipld/unixfs').Block>}
 */
export function createFileEncoderStream (blob, settings = defaultSettings) {
  /** @type {TransformStream<import('@ipld/unixfs').Block, import('@ipld/unixfs').Block>} */
  const { readable, writable } = new TransformStream({}, queuingStrategy)
  const unixfsWriter = UnixFS.createWriter({ writable, settings })
  const fileBuilder = new UnixFsFileBuilder(blob)
  ;(async () => {
    await fileBuilder.finalize(unixfsWriter)
    await unixfsWriter.close()
  })()
  return readable
}

class UnixFsFileBuilder {
  #file

  /** @param {{ stream: () => ReadableStream }} file */
  constructor (file) {
    this.#file = file
  }

  /** @param {import('@ipld/unixfs').View} writer */
  async finalize (writer) {
    const unixfsFileWriter = UnixFS.createFileWriter(writer)
    await this.#file.stream().pipeTo(
      new WritableStream({
        async write (chunk) {
          await unixfsFileWriter.write(chunk)
        }
      })
    )
    return unixfsFileWriter.close()
  }
}

class UnixFSDirectoryBuilder {
  /** @type {Map<string, UnixFsFileBuilder | UnixFSDirectoryBuilder>} */
  entries = new Map()

  /** @param {import('@ipld/unixfs').View} writer */
  async finalize (writer) {
    const dirWriter = this.entries.size <= SHARD_THRESHOLD
      ? UnixFS.createDirectoryWriter(writer)
      /* c8 ignore next */
      : UnixFS.createShardedDirectoryWriter(writer)
    for (const [name, entry] of this.entries) {
      const link = await entry.finalize(writer)
      dirWriter.set(name, link)
    }
    return dirWriter.close()
  }
}

/**
 * @param {Iterable<import('./types').FileLike>} files
 * @param {UnixFS.EncoderSettings} [settings]
 * @returns {ReadableStream<import('@ipld/unixfs').Block>}
 */
export function createDirectoryEncoderStream (files, settings = defaultSettings) {
  const rootDir = new UnixFSDirectoryBuilder()

  for (const file of files) {
    const path = file.name.split('/')
    if (path[0] === '' || path[0] === '.') {
      path.shift()
    }
    let dir = rootDir
    for (const [i, name] of path.entries()) {
      if (i === path.length - 1) {
        dir.entries.set(name, new UnixFsFileBuilder(file))
        break
      }
      let dirBuilder = dir.entries.get(name)
      if (dirBuilder == null) {
        dirBuilder = new UnixFSDirectoryBuilder()
        dir.entries.set(name, dirBuilder)
      }
      if (!(dirBuilder instanceof UnixFSDirectoryBuilder)) {
        throw new Error(`"${name}" cannot be a file and a directory`)
      }
      dir = dirBuilder
    }
  }

  /** @type {TransformStream<import('@ipld/unixfs').Block, import('@ipld/unixfs').Block>} */
  const { readable, writable } = new TransformStream({}, queuingStrategy)
  const unixfsWriter = UnixFS.createWriter({ writable, settings })
  ;(async () => {
    await rootDir.finalize(unixfsWriter)
    await unixfsWriter.close()
  })()

  return readable
}
