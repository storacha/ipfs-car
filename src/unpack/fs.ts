import fs from 'fs'
import pipe from 'it-pipe'
import BufferList from 'bl'
import { map } from 'streaming-iterables'

import { CarIndexedReader, CarReader } from '@ipld/car'
import { CID } from 'multiformats'
import { UnixFSEntry } from '@vascosantos/ipfs-unixfs-exporter'

// tslint:disable-next-line: no-var-requires needs types
const toIterable = require('stream-to-it')

import { unpack } from '.'

// Node only, read a car from fs, write files to fs
export async function unpackToFs ({input, roots, output}: {input: string, roots?: CID[], output?: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  await writeFiles(unpack(carReader, roots), output)
}

// Node only, read a stream, write files to fs
export async function unpackStreamToFs ({input, roots, output}: {input: AsyncIterable<Uint8Array>, roots?: CID[], output?: string}) {
  // This stores blocks in memory, which is bad for large car files.
  // Could write the stream to a BlockStore impl first and make it abuse the disk instead.
  const carReader = await CarReader.fromIterable(input)
  await writeFiles(unpack(carReader, roots), output)
}

export async function writeFiles (source: AsyncIterable<UnixFSEntry>, output?: string) {
  for await (const file of source) {
    let filePath = file.path

    // output overrides the first part of the path.
    if (output) {
      const parts = file.path.split('/')
      parts[0] = output
      filePath = parts.join('/')
    }

    if (file.type === 'file' || file.type === 'raw') {
      await pipe(
        file.content,
        map((chunk: BufferList) => chunk.slice()), // BufferList to Buffer
        toIterable.sink(fs.createWriteStream(filePath))
      )
    } else if (file.type === 'directory' ){
      await fs.promises.mkdir(filePath, { recursive: true })
    } else {
      throw new Error(`Unsupported UnixFS type ${file.type} for ${file.path}`)
    }
  }
}
