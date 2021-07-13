import { Readable, Writable } from 'stream'

import last from 'it-last'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index.js'
import globSource from 'ipfs-utils/src/files/glob-source.js'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blockstore } from '../blockstore/index'
import { MemoryBlockStore } from '../blockstore/memory'

// Node version of toCar with Node Stream Writable
export async function packToStream ({ input, writable, blockstore: userBlockstore }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore?: Blockstore }) {
  if (!input || (Array.isArray(input) && !input.length)) {
    throw new Error('given input could not be parsed correctly')
  }

  const blockstore = userBlockstore ? userBlockstore : new MemoryBlockStore()

  // Consume the source
  const rootEntry = await last(pipe(
    normalizeAddInput(globSource(input, {
      recursive: true
    }),),
    (source: any) => importer(source, blockstore, {
      cidVersion: 1,
      chunker: 'fixed',
      maxChunkSize: 262144,
      hasher: sha256,
      rawLeaves: true,
      wrapWithDirectory: true
    })
  ))

  if (!rootEntry || !rootEntry.cid) {
    throw new Error('given input could not be parsed correctly')
  }

  const root = rootEntry.cid

  const { writer, out } = await CarWriter.create([root])
  Readable.from(out).pipe(writable)

  for await (const block of blockstore.blocks()) {
    await writer.put(block)
  }

  await writer.close()

  if (!userBlockstore) {
    await blockstore.close()
  }

  return { root }
}
