import all from 'it-all'
import pipe from 'it-pipe'

import { CarWriter } from '@ipld/car'
import { importer } from 'ipfs-unixfs-importer'
import normalizeAddInput from 'ipfs-core-utils/src/files/normalise-input/index'
import { ImportCandidateStream } from 'ipfs-core-types/src/utils'
import { sha256 } from 'multiformats/hashes/sha2'

import { Blockstore } from '../blockstore'
import { MemoryBlockStore } from '../blockstore/memory'

export async function pack ({ input, blockstore = new MemoryBlockStore() }: { input: ImportCandidateStream, blockstore: Blockstore }) {
  // Consume the source
  const unixFsEntries = await all(pipe(
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

  const root = unixFsEntries[unixFsEntries.length - 1].cid

  const { writer, out } = await CarWriter.create([root])

  for await (const block of blockstore.blocks()) {
    writer.put(block)
  }

  writer.close(),
  await blockstore.destroy()

  return { root, out }
}
