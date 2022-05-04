import fs from 'fs'
import os from 'os'
import path from 'path'
import moveFile from 'move-file'

import { packToStream } from './stream'
import { FsBlockStore } from '../blockstore/fs'
import type { PackProperties } from './index'

export interface PackToFsProperties extends PackProperties {
  input: string | Iterable<string> | AsyncIterable<string>,
  output?: string
}

export async function packToFs ({ input, output, blockstore: userBlockstore, hasher, maxChunkSize, maxChildrenPerNode, wrapWithDirectory, rawLeaves, verbose }: PackToFsProperties) {
  const blockstore = userBlockstore ? userBlockstore : new FsBlockStore()
  const location = output || `${os.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`
  const writable = fs.createWriteStream(location)

  const { root } = await packToStream({
    input,
    writable,
    blockstore,
    hasher,
    maxChunkSize,
    maxChildrenPerNode,
    wrapWithDirectory,
    rawLeaves,
    verbose
  })

  if (!userBlockstore) {
    await blockstore.close()
  }

  // Move to work dir
  if (!output) {
    const basename = typeof input === 'string' ? path.parse(path.basename(input)).name : root.toString()
    const filename = `${basename}.car`
    await moveFile(location, `${process.cwd()}/${filename}`)

    return {root, filename}
  }

  return { root, filename: output }
}
