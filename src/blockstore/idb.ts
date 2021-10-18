import * as idb from 'idb-keyval'
import { CID } from 'multiformats'
import { BlockstoreAdapter } from 'interface-blockstore'
import { Blockstore } from './index'

/**
 * Save blocks to IndexedDB in the browser via idb-keyval
 * Creates a probably unique indexed db per instance to ensure that the
 * blocks iteration method only returns blocks from this invocation,
 * and so that the caller can destory it without affecting others.
 */
export class IdbBlockStore extends BlockstoreAdapter implements Blockstore {
  private store: idb.UseStore

  constructor () {
    super()

    const dbName = `IdbBlockStore-${Date.now()}-${Math.random()}`
    this.store = idb.createStore(dbName, `IdbBlockStore`)
  }

  async * blocks () {
    const keys = await idb.keys(this.store)

    for await (const key of keys) {
      yield {
        cid: CID.parse(key.toString()),
        bytes: await idb.get(key, this.store)
      }
    }
  }

  async put (cid: CID, bytes: Uint8Array) {
    await idb.set(cid.toString(), bytes, this.store)
  }

  async get (cid: CID): Promise<Uint8Array> {
    const bytes = await idb.get(cid.toString(), this.store)

    if (!bytes) {
      throw new Error(`block with cid ${cid.toString()} no found`)
    }

    return bytes
  }

  async has (cid: CID) {
    const bytes = await idb.get(cid.toString(), this.store)
    return Boolean(bytes)
  }

  async close () {
    return idb.clear(this.store)
  }
}
