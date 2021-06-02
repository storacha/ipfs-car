import fs from 'fs'
import os from 'os'

import { CID } from 'multiformats'
import { Block } from '@ipld/car/api'

import { Blockstore } from './'

export class FsBlockStore implements Blockstore {
  store: Set<string>

  constructor() {
    this.store = new Set()
  }

  async put({ cid, bytes }: { cid: CID, bytes: Uint8Array }) {
    const cidStr = cid.toString()
    const location = `${os.tmpdir()}/${cidStr}`
    await fs.promises.writeFile(location, bytes)

    this.store.add(cidStr)

    return { cid, bytes }
  }

  async get(cid: CID): Promise<Block> {
    const cidStr = cid.toString()
    const location = `${os.tmpdir()}/${cidStr}`
    const bytes = await fs.promises.readFile(location)

    return { cid, bytes }
  }

  async * blocks() {
    for (const cidStr of this.store) {
      const location = `${os.tmpdir()}/${cidStr}`
      const bytes = await fs.promises.readFile(location)

      yield { cid: CID.parse(cidStr), bytes }
    }
  }

  async close () {
    for (const cidStr of this.store) {
      const location = `${os.tmpdir()}/${cidStr}`
      await fs.promises.rm(location)
    }
  }
}
