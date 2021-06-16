import { Readable, Writable } from 'stream'

import last from 'it-last'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from '@vascosantos/ipfs-unixfs-importer'
import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'
import globSource from 'ipfs-utils/src/files/glob-source'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blockstore } from '../blockstore'
import { MemoryBlockStore } from '../blockstore/memory'

// Node version of toCar with Node Stream Writable
export async function packToStream ({ input, writable, blockstore: userBlockstore }: { input: string | Iterable<string> | AsyncIterable<string>, writable: Writable, blockstore?: Blockstore }) {
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
      wrapWithDirectory: false // TODO: Set to true when not directory to keep names?
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
    await blockstore.destroy()
  }

  return { root }
}
