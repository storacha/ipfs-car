import fs from 'fs'
import { Readable, Writable } from 'stream'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import { UnixFSEntry } from 'ipfs-unixfs-exporter'

import { CID } from 'multiformats'
import all from 'it-all'
import pipe from 'it-pipe'

import { sha256 } from 'multiformats/hashes/sha2'

import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'

import globSource from 'ipfs-utils/src/files/glob-source'
import { WriterChannel } from '@ipld/car/lib/writer'

export async function packFileToCarFs ({ input, output }: { input: string | Iterable<string> | AsyncIterable<string>, output?: string }) {
  const writable = fs.createWriteStream(output || 'output.car') // TODO: How to handle default naming given we do not have cid

  return packFileToCar({input, writable})
}

export async function packFileToCar ({ input, writable }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable}) {
  let writerChannel: WriterChannel | undefined

  const blockStore: Array<{ cid: CID, bytes: Uint8Array }> = []

  const blockApi = {
    put: ({ cid, bytes }: { cid: CID, bytes: Uint8Array}) => {
      blockStore.push({ cid, bytes })

      return Promise.resolve({ cid, bytes })
    },
    get: (cid: CID) => {
      return Promise.reject(new Error('should not get blocks'))
    }
  }

  // Consume the source
  await all(pipe(
    normalizeAddInput(globSource(input, {
      recursive: true
    })),
    (source: any) => importer(source, blockApi, {
      cidVersion: 1,
      chunker: 'fixed',
      maxChunkSize: 262144,
      hasher: sha256,
      rawLeaves: true,
      wrapWithDirectory: false // TODO: Set to true when not directory to keep names?
    }), // TODO: recheck defaults
  ))

  if (!blockStore.length) {
    throw new Error('error')
  }

  writerChannel = CarWriter.create([blockStore[blockStore.length - 1].cid])
  Readable.from(writerChannel.out).pipe(writable)
  
  for (let i = 0; i < blockStore.length; i++) {
    await writerChannel.writer.put(blockStore[i])
  }

  await writerChannel.writer.close()
}

// UnixFs to Car function
export async function toCar ({ files, writable }: { files: UnixFSEntry[], writable: Writable}) {
  // create the writer and set the header with the roots
  // Just single root, multiple files: WRAP
  const { writer, out } = await CarWriter.create([files[0].cid])
  Readable.from(out).pipe(writable)

  for (let i = 0; i < files.length; i++) {
    // TODO: This gets everything in memory...
    const bytes = await all(files[i].content())

    await writer.put({
      cid: files[i].cid,
      bytes: bytes[0]
    })
  }

  await writer.close()
}
