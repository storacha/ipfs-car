import fs from 'fs'
import os from 'os'
import path from 'path'
import process from 'process'
import { Readable, Writable } from 'stream'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import { UnixFSEntry } from 'ipfs-unixfs-exporter'

import all from 'it-all'
import pipe from 'it-pipe'

import { sha256 } from 'multiformats/hashes/sha2'

import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'

import globSource from 'ipfs-utils/src/files/glob-source'

import { Blockstore } from './blockstore'
import { MemoryBlockStore } from './blockstore/memory'
import { FsBlockStore } from './blockstore/fs'

export async function packFileToCarFs ({ input, output, blockstore = new FsBlockStore() }: { input: string | Iterable<string> | AsyncIterable<string>, output?: string, blockstore?: Blockstore }) {
  const location = output || `${os.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`
  const writable = fs.createWriteStream(location)

  const root = await pack({ input, writable, blockstore })

  // Move to work dir
  if (!output) {
    const inputName = typeof input === 'string' ? path.parse(path.basename(input)).name : root.toString()
    await fs.promises.rename(location, `${process.cwd()}/${inputName}.car`)
  }
}

export async function packFileIterableToCar ({ input, writable, blockstore = new MemoryBlockStore() }: { input: Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore?: Blockstore }) {
  await pack({ input, writable, blockstore })
}

async function pack ({ input, writable, blockstore }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore: Blockstore }) {
  // Consume the source
  const unixFsEntries = await all(pipe(
    normalizeAddInput(globSource(input, {
      recursive: true
    })),
    (source: any) => importer(source, blockstore, {
      cidVersion: 1,
      chunker: 'fixed',
      maxChunkSize: 262144,
      hasher: sha256,
      rawLeaves: true,
      wrapWithDirectory: false // TODO: Set to true when not directory to keep names?
    })
  ))

  const root = unixFsEntries[unixFsEntries.length - 1].cid

  const { writer, out } = await CarWriter.create([root])
  Readable.from(out).pipe(writable)

  for await (const block of blockstore.blocks()) {
    await writer.put(block)
  }

  await Promise.all([
    writer.close(),
    blockstore.close()
  ])

  return root
}

// UnixFs to Car function
export async function toCar ({ files, writable }: { files: UnixFSEntry[], writable: Writable }) {
  // create the writer and set the header with the roots
  // Just single root, multiple files: WRAP
  const { writer, out } = await CarWriter.create([files[0].cid])
  Readable.from(out).pipe(writable)

  for (const file of files) {
    const bytes = await all(file.content())

    await writer.put({
      cid: file.cid,
      bytes: bytes[0]
    })
  }

  await writer.close()
}
