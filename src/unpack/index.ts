import toIterable from 'browser-readablestream-to-it'
import { CarBlockIterator } from '@ipld/car/iterator'
import { CarReader } from '@ipld/car/api'
import { CID } from 'multiformats'
import exporter from 'ipfs-unixfs-exporter'
import type { UnixFSEntry } from 'ipfs-unixfs-exporter'
export type { UnixFSEntry }

import { VerifyingGetOnlyBlockStore } from './utils/verifying-get-only-blockstore'
import { Blockstore } from '../blockstore/index'
import { MemoryBlockStore } from '../blockstore/memory'

// Export unixfs entries from car file
export async function* unpack(carReader: CarReader, roots?: CID[]): AsyncIterable<UnixFSEntry> {
  const verifyingBlockService = VerifyingGetOnlyBlockStore.fromCarReader(carReader)

  if (!roots || roots.length === 0 ) {
    roots = await carReader.getRoots()
  }

  for (const root of roots) {
    yield* exporter.recursive(root, verifyingBlockService, { /* options */ })
  }
}

export async function* unpackStream(readable: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>, { roots, blockstore: userBlockstore }: { roots?: CID[], blockstore?: Blockstore } = {}): AsyncIterable<UnixFSEntry> {
  const carIterator = await CarBlockIterator.fromIterable(asAsyncIterable(readable))
  const blockstore = userBlockstore || new MemoryBlockStore()

  for await (const block of carIterator) {
    await blockstore.put(block.cid, block.bytes)
  }

  const verifyingBlockStore = VerifyingGetOnlyBlockStore.fromBlockstore(blockstore)

  if (!roots || roots.length === 0 ) {
    roots = await carIterator.getRoots()
  }

  for (const root of roots) {
    yield* exporter.recursive(root, verifyingBlockStore)
  }
}

/**
 * Upgrade a ReadableStream to an AsyncIterable if it isn't already
 *
 * ReadableStream (e.g res.body) is asyncIterable in node, but not in chrome, yet.
 * see: https://bugs.chromium.org/p/chromium/issues/detail?id=929585
 */
 function asAsyncIterable(readable: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array> {
  // @ts-ignore how to convince tsc that we are checking the type here?
   return Symbol.asyncIterator in readable ? readable : toIterable(readable)
}

