import fs from 'fs'
import pipe from 'it-pipe'
import equals from 'uint8arrays/equals'
import { map } from 'streaming-iterables'
import BufferList from 'bl'

import { CarIndexedReader, CarReader } from '@ipld/car'
import { Block } from '@ipld/car/api'
import { CID } from 'multiformats'
import { sha256 } from 'multiformats/hashes/sha2'
import exporter from 'ipfs-unixfs-exporter'
import { UnixFSEntry } from 'ipfs-unixfs-exporter'

const toIterable = require('stream-to-it')

// Node only, read a car from fs, write files to fs
export async function unpackCarToFs ({input, roots, output}: {input: string, roots?: CID[], output?: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  await writeFiles(fromCar(carReader, roots), output)
}

// Node only, read a stream, write files to fs
export async function unpackCarStreamToFs ({input, roots, output}: {input: AsyncIterable<Uint8Array>, roots?: CID[], output?: string}) {
  // This stores blocks in memory, which is bad for large car files.
  // Could write the stream to a BlockStore impl first and make it abuse the disk instead.
  const carReader = await CarReader.fromIterable(input)
  await writeFiles(fromCar(carReader, roots), output)
}

export async function* fromCar (carReader: CarReader|CarIndexedReader, roots?: CID[]): AsyncIterable<UnixFSEntry> {
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

  if (!roots || roots.length === 0 ) {
    roots = await carReader.getRoots()
  }

  for (const root of roots) {
    yield* exporter.recursive(root, verifyingBlockService, { /* options */ })
  }
}

export async function writeFiles (source: AsyncIterable<UnixFSEntry>, output?: string) {
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

async function isValid ({ cid, bytes }: Block) {
  // TODO: simple defaults for now
  const hash = await sha256.digest(bytes)
  return equals(hash.digest, cid.multihash.digest)
}

