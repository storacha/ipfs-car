import { equals } from 'uint8arrays'
import { Block } from '@ipld/car/api'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats'
import { CarReader } from '@ipld/car/api'
import { BlockstoreAdapter } from 'interface-blockstore'
import { Blockstore } from '../../blockstore/index'

type verifyingBlockStore = { get: (cid: CID) => Promise<Uint8Array | undefined> }

export class VerifyingGetOnlyBlockStore extends BlockstoreAdapter {
  store: verifyingBlockStore

  constructor (blockstore: verifyingBlockStore) {
    super()
    this.store = blockstore
  }

  async get (cid: CID) : Promise<Uint8Array> {
    const res = await this.store.get(cid)

    if (!res) {
      throw new Error(`Incomplete CAR. Block missing for CID ${cid}`)
    }
    if (!isValid({ cid, bytes: res })) {
      throw new Error(`Invalid CAR. Hash of block data does not match CID ${cid}`)
    }
    return res
  }

  static fromBlockstore (b: Blockstore) {
    return new VerifyingGetOnlyBlockStore(b)
  }

  static fromCarReader (cr: CarReader) {
    return new VerifyingGetOnlyBlockStore({
      // Return bytes in the same fashion as a Blockstore implementation
      get: async (cid: CID) => {
        const block = await cr.get(cid)

        return block?.bytes
      }
    })
  }
}

async function isValid ({ cid, bytes }: Block) {
  const hash = await sha256.digest(bytes)
  return equals(hash.digest, cid.multihash.digest)
}
