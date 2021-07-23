import { Blob } from "@web-std/blob"
import all from 'it-all'
import type { ImportCandidateStream } from 'ipfs-core-types/src/utils'
export type { ImportCandidateStream }

import { MemoryBlockStore } from '../blockstore/memory'
import { pack } from './index'
import type { PackProperties } from './index'

export async function packToBlob ({ input, blockstore: userBlockstore, maxChunkSize, wrapWithDirectory }: PackProperties) {
  const blockstore = userBlockstore ? userBlockstore : new MemoryBlockStore()
  const { root, out } = await pack({
    input,
    blockstore,
    maxChunkSize,
    wrapWithDirectory
  })

  if (!userBlockstore) {
    await blockstore.close()
  }

  const carParts = await all(out)
  const car = new Blob(carParts, {
    type: 'application/car',
  })

  return { root, car }
}
