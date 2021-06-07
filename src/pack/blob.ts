import all from 'it-all'
import { ImportCandidateStream } from 'ipfs-core-types/src/utils'

import { Blockstore } from '../blockstore'
import { MemoryBlockStore } from '../blockstore/memory'

import { pack } from './'

export async function packToBlob ({ input, blockstore: userBlockstore }: { input: ImportCandidateStream, blockstore?: Blockstore }) {
  const blockstore = userBlockstore ? userBlockstore : new MemoryBlockStore()
  const { root, out } = await pack({
    input,
    blockstore
  })

  if (!userBlockstore) {
    await blockstore.destroy()
  }

  const carParts = await all(out)
  const car = new Blob(carParts, {
    type: 'application/car',
  })

  return { root, car }
}
