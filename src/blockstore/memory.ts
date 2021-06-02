import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

import { Blockstore } from './'

export class MemoryBlockStore implements Blockstore {
  store: Map<string, Uint8Array>

  constructor () {
    this.store = new Map()
  }

  async * blocks () {
    for (const [cidStr, bytes] of this.store.entries()) {
      yield { cid: CID.parse(cidStr), bytes }
    }
  }

  put ({ cid, bytes }: { cid: CID, bytes: Uint8Array }) {
    this.store.set(cid.toString(), bytes)
    return Promise.resolve({ cid, bytes })
  }

  get (cid: CID) : Promise<Block> {
    const bytes = this.store.get(cid.toString())

    if (!bytes) {
      return Promise.reject(new Error(`No blocks for the given CID: ${cid.toString()}`))
    }

    return Promise.resolve({
      bytes,
      cid
    })
  }

  close () {
    this.store.clear()
    return Promise.resolve()
  }
}
