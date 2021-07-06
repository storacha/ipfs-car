import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

import { Blockstore } from './index'

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

  put ({ cid, bytes }: Block) {
    this.store.set(cid.toString(), bytes)
    return Promise.resolve({ cid, bytes })
  }

  get (cid: CID) : Promise<Block|undefined> {
    const bytes = this.store.get(cid.toString())

    if (!bytes) {
      return Promise.resolve(undefined)
    }

    return Promise.resolve({
      bytes,
      cid
    })
  }

  destroy () {
    this.store.clear()
    return Promise.resolve()
  }
}
