import fs from 'fs'
import os from 'os'
import path from 'path'
import mv from 'mv'
import util from 'util'

import { packToStream } from './stream'

import { Blockstore } from '../blockstore'
import { FsBlockStore } from '../blockstore/fs'

const mvP = util.promisify(mv)

export async function packToFs ({ input, output, blockstore: userBlockstore }: { input: string | Iterable<string> | AsyncIterable<string>, output?: string, blockstore?: Blockstore }) {
  const blockstore = userBlockstore ? userBlockstore : new FsBlockStore()
  const location = output || `${os.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`
  const writable = fs.createWriteStream(location)

  const root = await packToStream({ input, writable, blockstore })

  if (!userBlockstore) {
    await blockstore.destroy()
  }

  // Move to work dir
  if (!output) {
    const inputName = typeof input === 'string' ? path.parse(path.basename(input)).name : root.toString()
    await mvP(location, `${process.cwd()}/${inputName}.car`)
  }
}
