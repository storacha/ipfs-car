// This is olizilla's fork of index.ts to show WIP.
// It is imagined that we'd pull index.ts apart into from-car.ts and to-car.ts
// so consumers could import just the direction they are interested in.

import fs from 'fs'
import pipe from 'it-pipe'
import equals from 'uint8arrays/equals'
import { map } from 'streaming-iterables'
import BufferList from 'bl'

import { CarIndexedReader, CarCIDIterator, CarReader } from '@ipld/car'
import { Block } from '@ipld/car/api'
import { CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'

// appeasing tsc 
interface CarReaderish {
  getRoots(): Promise<CID[]>
  get(key: CID): Promise<Block | undefined>
}

// appeasing tsc, figure out how to import from unix-fs-exporter
interface UnixFSEntryish {
  type: 'file' | 'directory' | 'object' | 'raw' | 'identity',
  name: string
  path: string
  content: () => AsyncIterable<Uint8Array>
}

// TODO: Needs module with types commited + typedefinitions fixed (different cids...)
// import exporter from 'ipfs-unixfs-exporter'
const exporter: any = require('ipfs-unixfs-exporter')
const toIterable = require('stream-to-it')

// Node only, read a car from fs, write files to fs
export async function unpackCarToFs ({input, output}: {input: string, output?: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  await writeFiles(fromCar(carReader), output)
}

export async function unpackCarStreamToFs ({input, output}: {input: AsyncIterable<Uint8Array>, output?: string}) {
  // This stores blocks in memory, which is bad for large car files.
  // Could write the stream to a BlockStore impl first and make it abuse the disk instead.
  const carReader = await CarReader.fromIterable(input)
  await writeFiles(fromCar(carReader), output)
}

export async function listFilesInCar ({input}: {input: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  for await (const file of fromCar(carReader)) {
    console.log(file.path)
  }
}

export async function listCidsInCar ({input}: {input: string}) {
  const carIterator = await CarCIDIterator.fromIterable(fs.createReadStream(input))
  for await (const cid of carIterator) {
    console.log(cid.toString())
  }
}

export async function* fromCar (carReader: CarReaderish, roots?: CID[] ) {
  const verifyingBlockService = {
    get: async (cid: CID) => {
      const res = await carReader.get(cid)
      if (!res) {
        throw new Error(`Incomplete CAR. Block missing for CID ${cid}`)
      }
      if (!isValid(res)) {
        throw new Error(`Invalid CAR. Hash of block data does not match CID ${cid}`)
      }
      return res
    }
  }

  if (!roots) {
    roots = await carReader.getRoots()
  }

  for (const root of roots) {
    for await (const file of exporter.recursive(root, verifyingBlockService, { /* options */ })) {
      yield file
    }
  }
}

export async function writeFiles (source: AsyncIterable<UnixFSEntryish>, output?: string) {
  for await (const file of source) {
    let filePath = file.path
    
    // output overrides the first part of the path.
    if (output) {
      const parts = file.path.split('/')
      parts[0] = output
      filePath = parts.join('/')
    }

    if (file.type === 'file' || file.type === 'raw') {
      await pipe(
        file.content,
        map((chunk: BufferList) => chunk.slice()), // BufferList to Buffer
        toIterable.sink(fs.createWriteStream(filePath))
      )
    } else if (file.type === 'directory' ){
      await fs.promises.mkdir(filePath, { recursive: true })
    } else {
      throw new Error(`Unsupported UnixFS type ${file.type} for ${file.path}`)
    }
  }
}

async function isValid({ cid, bytes }: Block) {
  // TODO: simple defaults for now
  const hash = await sha256.digest(bytes)
  return equals(hash.digest, cid.multihash.digest)
}

