import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

export class MemoryBlockStore {
  store: Map<CID, Uint8Array>

  constructor () {
    this.store = new Map()
  }

  async * blocks () {
    for (const [cid, bytes] of this.store.entries()) {
      yield { cid, bytes }
    }
  }

  put ({ cid, bytes }: { cid: CID, bytes: Uint8Array }) {
    this.store.set(cid, bytes)
    return Promise.resolve({ cid, bytes })
  }

  get (cid: CID) : Promise<Block> {
    const bytes = this.store.get(cid)

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
