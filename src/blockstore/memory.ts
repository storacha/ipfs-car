import { CID } from 'multiformats'
import { BaseBlockstore } from 'blockstore-core'
import { Blockstore } from './index'

export class MemoryBlockStore extends BaseBlockstore implements Blockstore {
  store: Map<string, Uint8Array>

  constructor () {
    super()
    this.store = new Map()
  }

  async * blocks () {
    for (const [cidStr, bytes] of this.store.entries()) {
      yield { cid: CID.parse(cidStr), bytes }
    }
  }

  put (cid: CID, bytes: Uint8Array) {
    this.store.set(cid.toString(), bytes)

    return Promise.resolve()
  }

  get (cid: CID) : Promise<Uint8Array> {
    const bytes = this.store.get(cid.toString())

    if (!bytes) {
      throw new Error(`block with cid ${cid.toString()} no found`)
    }

    return Promise.resolve(bytes)
  }

  has (cid: CID) {
    return Promise.resolve(this.store.has(cid.toString()))
  }

  close () {
    this.store.clear()
    return Promise.resolve()
  }
}
