import fs from 'fs'
import { pipeline } from 'stream/promises'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

/** CAR CID code */
const carCode = 0x0202

/** @param {string} carPath */
export default async function hash (carPath) {
  let bytes
  if (carPath) {
    bytes = await fs.promises.readFile(carPath)
  } else {
    bytes = await pipeline(
      process.stdin,
      async (source) => {
        const chunks = []
        for await (const chunk of source) {
          chunks.push(chunk)
        }
        return Buffer.concat(chunks)
      }
    )
  }

  console.log(CID.createV1(carCode, await sha256.digest(bytes)).toString())
}
