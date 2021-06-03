import { Readable, Writable } from 'stream'

import all from 'it-all'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'
import globSource from 'ipfs-utils/src/files/glob-source'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blockstore } from '../blockstore'
import { MemoryBlockStore } from '../blockstore/memory'

export async function toCar ({ input, writable, blockstore }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore: Blockstore }) {
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

export default async function pack ({ input, writable, blockstore = new MemoryBlockStore() }: { input: Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore?: Blockstore }) {
  await toCar({ input, writable, blockstore })
}
