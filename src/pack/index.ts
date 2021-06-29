import last from 'it-last'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from '@vascosantos/ipfs-unixfs-importer'
import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index.js'
import { ImportCandidateStream as ImportCandidateStreamT } from 'ipfs-core-types/src/utils'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blockstore } from '../blockstore/index'
import { MemoryBlockStore } from '../blockstore/memory'

export type ImportCandidateStream = ImportCandidateStreamT

export async function pack ({ input, blockstore: userBlockstore }: { input: ImportCandidateStream, blockstore?: Blockstore }) {
  const blockstore = userBlockstore ? userBlockstore : new MemoryBlockStore()

  // Consume the source
  const rootEntry = await last(pipe(
    normalizeAddInput(input),
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

  for await (const block of blockstore.blocks()) {
    writer.put(block)
  }

  writer.close()

  if (!userBlockstore) {
    await blockstore.destroy()
  }

  return { root, out }
}
