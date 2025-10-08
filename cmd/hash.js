import fs from 'fs'
import crypto from 'crypto'
import { pipeline } from 'stream/promises'
import { CID } from 'multiformats/cid'
import * as Digest from 'multiformats/hashes/digest'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'

/** CAR CID code */
const carCode = 0x0202

/**
 * @param {string} carPath
 * @param {{ 'only-multihash': boolean }} [opts]
 */
export default async function hash (carPath, opts) {
  const hasher = crypto.createHash('sha256')

  await pipeline(
    carPath ? fs.createReadStream(carPath) : process.stdin,
    async (source) => {
      for await (const chunk of source) {
        hasher.update(chunk)
      }
    }
  )

  const digest = Digest.create(sha256.code, hasher.digest())
  if (opts?.['only-multihash']) {
    console.log(base58btc.encode(digest.bytes))
  } else {
    console.log(CID.createV1(carCode, digest).toString())
  }
}
