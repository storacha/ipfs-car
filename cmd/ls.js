import fs from 'fs'
import { pipeline } from 'stream/promises'
import { CarIndexedReader } from '@ipld/car/indexed-reader'
import { recursive as exporter } from 'ipfs-unixfs-exporter'
import { tmpPath } from './lib/tmp.js'
import { getRoots } from './lib/car.js'

/**
 * @param {string} carPath
 * @param {object} [opts]
 * @param {string} [opts.root]
 * @param {boolean} [opts.verbose]
 */
export default async function ls (carPath, opts = {}) {
  if (!carPath) {
    carPath = tmpPath()
    await pipeline(process.stdin, fs.createWriteStream(carPath))
  }

  const reader = await CarIndexedReader.fromFile(carPath)
  const roots = await getRoots(reader, opts)

  // @ts-expect-error
  const entries = exporter(roots[0], {
    async get (cid) {
      const block = await reader.get(cid)
      if (!block) {
        console.error(`missing block: ${cid}`)
        process.exit(1)
      }
      return block.bytes
    }
  })

  const prefix = roots[0].toString()
  for await (const entry of entries) {
    if (entry.type === 'file' || entry.type === 'raw' || entry.type === 'directory') {
      if (opts.verbose) {
        const size = entry.type === 'directory' ? '-' : entry.size
        console.log(`${entry.cid}\t${size}\t${entry.path.replace(prefix, '.')}`)
      } else {
        console.log(entry.path.replace(prefix, '.'))
      }
    }
  }
}
