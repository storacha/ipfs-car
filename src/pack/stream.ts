import { Readable, Writable } from 'stream'

import last from 'it-last'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import { normaliseInput } from 'ipfs-core-utils/files/normalise-input-multiple'
import globSource from 'ipfs-utils/src/files/glob-source.js'

import { MemoryBlockStore } from '../blockstore/memory'
import { unixfsImporterOptionsDefault } from './constants'

import type { PackProperties } from './index'

export interface PackToStreamProperties extends PackProperties {
  input: string | Iterable<string> | AsyncIterable<string>,
  writable: Writable
}

// Node version of toCar with Node Stream Writable
export async function packToStream ({ input, writable, blockstore: userBlockstore, hasher, maxChunkSize, maxChildrenPerNode, wrapWithDirectory }: PackToStreamProperties) {
  if (!input || (Array.isArray(input) && !input.length)) {
    throw new Error('given input could not be parsed correctly')
  }
  input = typeof input === 'string' ? [input] : input

  const blockstore = userBlockstore ? userBlockstore : new MemoryBlockStore()

  // Consume the source
  const rootEntry = await last(pipe(
    async function * () {
      for await (const it of input) {
        yield * globSource(process.cwd(), it)
      }
    },
    source => normaliseInput(source),
    (source: any) => importer(source, blockstore, {
      ...unixfsImporterOptionsDefault,
      hasher: hasher || unixfsImporterOptionsDefault.hasher,
      maxChunkSize: maxChunkSize || unixfsImporterOptionsDefault.maxChunkSize,
      maxChildrenPerNode: maxChildrenPerNode || unixfsImporterOptionsDefault.maxChildrenPerNode,
      wrapWithDirectory: wrapWithDirectory === false ? false : unixfsImporterOptionsDefault.wrapWithDirectory
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
