import fs from 'fs'
import os from 'os'

import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

import { Blockstore } from './'

export class FsBlockStore implements Blockstore {
  path: string
  _opened: boolean
  _opening?: Promise<void>

  constructor () {
    this.path = `${os.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`
    this._opened = false
  }

  async _open () {
    if (this._opening) {
      await this._opening
    } else {
      this._opening = fs.promises.mkdir(this.path)
      await this._opening
      this._opened = true
    }
  }

  async put ({ cid, bytes }: { cid: CID, bytes: Uint8Array }) {
    if (!this._opened) {
      await this._open()
    }

    const cidStr = cid.toString()
    const location = `${this.path}/${cidStr}`
    await fs.promises.writeFile(location, bytes)

    return { cid, bytes }
  }

  async get (cid: CID): Promise<Block> {
    if (!this._opened) {
      await this._open()
    }

    const cidStr = cid.toString()
    const location = `${this.path}/${cidStr}`
    const bytes = await fs.promises.readFile(location)

    return { cid, bytes }
  }

  async * blocks () {
    if (!this._opened) {
      await this._open()
    }

    const cids = await fs.promises.readdir(this.path)

    for (const cidStr of cids) {
      const location = `${this.path}/${cidStr}`
      const bytes = await fs.promises.readFile(location)

      yield { cid: CID.parse(cidStr), bytes }
    }
  }

  async destroy () {
    await fs.promises.rm(this.path, { recursive: true })
  }
}
