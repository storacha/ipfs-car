import fs from 'fs'
import path from 'path'
import moveFile from 'move-file'

import { packToStream } from './stream'
import { FsBlockStore } from '../blockstore/fs'
import type { PackProperties } from './index'

export interface PackToFsProperties extends PackProperties {
  input: string | Iterable<string> | AsyncIterable<string>,
  output?: string
}

export async function packToFs ({ input, output, blockstore: userBlockstore, hasher, maxChunkSize, maxChildrenPerNode, wrapWithDirectory, rawLeaves }: PackToFsProperties) {
  const realpath = path.basename(await fs.promises.realpath(input as string))
  const inputBasename = realpath === "/" ? "file" : realpath
  const blockstore = userBlockstore ? userBlockstore : new FsBlockStore(`/tmp/${inputBasename}.tmp.${process.pid}`)
  const location = output || `${process.cwd()}/.${inputBasename}.car.tmp.${process.pid}`
  const writable = fs.createWriteStream(location)

  const { root } = await packToStream({
    input,
    writable,
    blockstore,
    hasher,
    maxChunkSize,
    maxChildrenPerNode,
    wrapWithDirectory,
    rawLeaves
  })

  if (!userBlockstore) {
    await blockstore.close()
  }

  // Move to work dir
  if (!output) {
    const basename = typeof input === 'string' ? path.parse(path.basename(input)).name : root.toString()
    const filename = basename === "/" ? "file.car" : `${basename}.car`
    await moveFile(location, `${process.cwd()}/${filename}`)

    return {root, filename}
  }

  return { root, filename: output }
}
