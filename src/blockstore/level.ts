import level from 'level'
import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

// @ts-ignore toIterable has no types exported
import toIterable from 'stream-to-it'

import { Blockstore } from './'

export class LevelBlockStore implements Blockstore {
  store: level.LevelDB
  _opened: boolean

  constructor ({ location }: {location?: string} = {}) {
    this.store = level(location || `.blockstore-${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`, {
      valueEncoding: 'binary',
      compression: false
    })

    this._opened = false
  }

  async _open () {
    await this.store.open()
    this._opened = true
  }

  async * blocks () {
    if (!this._opened) {
      await this._open()
    }

    for await (const { key, value } of toIterable(this.store.createReadStream())) {
      yield {
        cid: CID.parse(key),
        bytes: value
      } as Block
    }
  }

  async put ({ cid, bytes }: { cid: CID, bytes: Uint8Array }) {
    if (!this._opened) {
      await this._open()
    }

    await this.store.put(cid.toString(), bytes)
    return { cid, bytes }
  }

  async get (cid: CID): Promise<Block> {
    if (!this._opened) {
      await this._open()
    }

    const bytes = await this.store.get(cid.toString())

    if (!bytes) {
      return Promise.reject(new Error(`No blocks for the given CID: ${cid.toString()}`))
    }

    return Promise.resolve({
      bytes,
      cid
    })
  }

  async destroy() {
    await this.store.clear()
    return this.store.close()
  }
}
