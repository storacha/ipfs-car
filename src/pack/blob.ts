import all from 'it-all'
import { ImportCandidateStream } from 'ipfs-core-types/src/utils'

import { Blockstore } from '../blockstore'
import { MemoryBlockStore } from '../blockstore/memory'

import { pack } from './'

export async function packToBlob ({ input, blockstore = new MemoryBlockStore() }: { input: ImportCandidateStream, blockstore: Blockstore }) {
  const { root, out } = await pack({
    input,
    blockstore
  })

  const carParts = await all(out)
  const car = new Blob(carParts, {
    type: 'application/car',
  })

  return { root, car }
}
