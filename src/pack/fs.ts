import fs from 'fs'
import os from 'os'
import path from 'path'

import { packToStream } from './stream'

import { Blockstore } from '../blockstore'
import { FsBlockStore } from '../blockstore/fs'

export async function packToFs ({ input, output, blockstore = new FsBlockStore() }: { input: string | Iterable<string> | AsyncIterable<string>, output?: string, blockstore?: Blockstore }) {
  const location = output || `${os.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`
  const writable = fs.createWriteStream(location)

  const root = await packToStream({ input, writable, blockstore })

  // Move to work dir
  if (!output) {
    const inputName = typeof input === 'string' ? path.parse(path.basename(input)).name : root.toString()
    await fs.promises.rename(location, `${process.cwd()}/${inputName}.car`)
  }
}
