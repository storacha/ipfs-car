import equals from 'uint8arrays/equals'
import { sha256 } from 'multiformats/hashes/sha2'

import { CarIndexedReader, CarReader } from '@ipld/car'
import { Block } from '@ipld/car/api'
import { CID } from 'multiformats'
import exporter from 'ipfs-unixfs-exporter'
import { UnixFSEntry } from 'ipfs-unixfs-exporter'

// Export unixfs entries from car file
export async function* unpack (carReader: CarReader|CarIndexedReader, roots?: CID[]): AsyncIterable<UnixFSEntry> {
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
    },
    put: ({ cid, bytes }: { cid: CID, bytes: Uint8Array }) => {
      return Promise.reject(new Error('should not get blocks'))
    }
  }

  if (!roots || roots.length === 0 ) {
    roots = await carReader.getRoots()
  }

  for (const root of roots) {
    yield* exporter.recursive(root, verifyingBlockService, { /* options */ })
  }
}

async function isValid ({ cid, bytes }: Block) {
  const hash = await sha256.digest(bytes)
  return equals(hash.digest, cid.multihash.digest)
}
