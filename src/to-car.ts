import fs from 'fs'
import { Readable, Writable } from 'stream'

import { CarWriter } from '@ipld/car'

import { CID } from 'multiformats'
import all from 'it-all'
import pipe from 'it-pipe'

import { sha256 } from 'multiformats/hashes/sha2'

import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'

import globSource from 'ipfs-utils/src/files/glob-source'
import { WriterChannel } from '@ipld/car/lib/writer'

// TODO: Needs module with types commited + typedefinitions fixed (different cids...)
// import importer from 'ipfs-unixfs-importer'
const { importer }: any = require('ipfs-unixfs-importer')

// TODO: create types.ts
interface UnixFSEntryish {
  type: 'file' | 'directory' | 'object' | 'raw' | 'identity',
  name: string
  cid: CID
  path: string
  content: () => AsyncIterable<Uint8Array>
}

export async function packFileToCarFs ({ input, output }: { input: string | Iterable<string> | AsyncIterable<string>, output?: string }) {
  const writable = fs.createWriteStream(output || 'output.car') // TODO: How to handle default naming given we do not have cid

  return packFileToCar({input, writable})
}

export async function packFileToCar ({ input, writable }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable}) {
  let writerChannel: WriterChannel | undefined

  const writeBlockService = {
    put: async ({ cid, bytes }: { cid: CID, bytes: Uint8Array}) => {
      if (!writerChannel) {
        writerChannel = await CarWriter.create([cid])
        // const writable = fs.createWriteStream(output || `${cid.toString()}.car`)
        Readable.from(writerChannel.out).pipe(writable)
      }

      await writerChannel.writer.put({
        cid,
        bytes
      })
    }
  }

  // Consume the source
  await all(pipe(
    normalizeAddInput(globSource(input, {
      recursive: true
    })),
    (source: any) => importer(source, writeBlockService, {
      cidVersion: 1,
      chunker: 'fixed',
      maxChunkSize: 262144,
      hasher: sha256,
      rawLeaves: true // TODO: option for now
    }), // TODO: check defaults
  ))

  if (!writerChannel) {
    throw new Error('any file was read')
  }

  await writerChannel.writer.close()
}

// UnixFs to Car function
export async function toCar ({ files, writable }: { files: UnixFSEntryish[], writable: Writable}) {
  // create the writer and set the header with the roots
  // Just single root, multiple files: WRAP
  const { writer, out } = await CarWriter.create([files[0].cid])
  Readable.from(out).pipe(writable)

  for (let i = 0; i < files.length; i++) {
    // TODO: This gets everything in memory
    const bytes = await all(files[i].content())

    await writer.put({
      cid: files[i].cid,
      bytes: bytes[0]
    })
  }

  await writer.close()
}
