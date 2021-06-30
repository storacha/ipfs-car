import * as idb from 'idb-keyval'

import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

import { Blockstore } from './index'

/**
 * Save blocks to IndexedDB in the browser via idb-keyval
 * Creates a probably unique indexed db per instance to ensure that the 
 * blocks iteration method only returns blocks from this invocation, 
 * and so that the caller can destory it without affecting others.
 */
export class IdbBlockStore implements Blockstore {
  private store: idb.UseStore

  constructor () {
    const dbName = `${Date.now()}-${Math.random()}`
    this.store = idb.createStore(dbName, `IdbBlockStore`)
  }

  async * blocks () {
    const keys = await idb.keys()
    for (const key of keys) {
      yield idb.get(key, this.store)
    }
  }

  async put (block: Block) {
    await idb.set(block.cid.toString(), block, this.store)
    return block
  }

  async get (cid: CID): Promise<Block | undefined> {
    return idb.get(cid.toString(), this.store)
  }

  async destroy () {
    return idb.clear(this.store)
  }
}
