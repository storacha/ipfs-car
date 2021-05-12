import fs from 'fs'
import path from 'path'
import pipe from 'it-pipe'
import equals from 'uint8arrays/equals'
import { map } from 'streaming-iterables'
import BufferList from 'bl'

import { CarReader } from '@ipld/car'
import { Block } from '@ipld/car/api'
import { CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'

// TODO: Needs module with types commited + typedefinitions fixed (different cids...)
// import exporter from 'ipfs-unixfs-exporter'
const exporter: any = require('ipfs-unixfs-exporter')
const toIterable = require('stream-to-it')

export async function* fromCar (carReader: CarReader) {
  let blockCount = 0
  const verifyingBlockService = {
    get: async (cid: CID) => {
      const res = await carReader.get(cid)
      if (!res || !isValid(res)) {
        throw new Error(`Bad block. Hash does not match CID ${cid}`)
      }
      blockCount++
      return res
    }
  }

  const roots = await carReader.getRoots()

  for (let i = 0; i < roots.length; i++) {
    for await (const file of exporter.recursive(roots[i], verifyingBlockService, { /* options */ })) {
      yield file
    }
  }
}

export async function* fromCarIterable (iterable: AsyncIterable<Uint8Array>) {
  const carReader = await CarReader.fromIterable(iterable)

  yield* fromCar(carReader)
}

export async function* fromCarToDisk (iterable: AsyncIterable<Uint8Array>, output: string) {
  const carReader = await CarReader.fromIterable(iterable)

  for await (const file of fromCar(carReader)) {
    const fullFilePath = path.join(output, file.path)

    if (file.type === 'file') {
      await fs.promises.mkdir(path.join(output, path.dirname(file.path)), { recursive: true })
      await pipe(
        file.content,
        map((chunk: BufferList) => chunk.slice()), // BufferList to Buffer
        toIterable.sink(fs.createWriteStream(fullFilePath))
      )
    } else {
      // this is a dir
      await fs.promises.mkdir(fullFilePath, { recursive: true })
    }
  }
}

export function fromCarByCid () : AsyncIterable<Uint8Array> {
  throw new Error('NOT YET IMPLEMENTED')
}

export function toCar () : AsyncIterable<Uint8Array> {
  throw new Error('NOT YET IMPLEMENTED')
}

async function isValid({ cid, bytes }: Block) {
  // TODO: simple defaults for now
  const hash = await sha256.digest(bytes)
  return equals(hash.digest, cid.multihash.digest)
}