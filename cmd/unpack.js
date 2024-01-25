import fs from 'fs'
import { pipeline } from 'stream/promises'
import { CarIndexedReader } from '@ipld/car/indexed-reader'
import { recursive as exporter } from 'ipfs-unixfs-exporter'
import { validateBlock } from '@web3-storage/car-block-validator'
import { tmpPath } from './lib/tmp.js'
import { getRoot } from './lib/car.js'

/**
 * @param {string} carPath
 * @param {object} [opts]
 * @param {string} [opts.root]
 * @param {boolean} [opts.verify]
 * @param {string} [opts.output]
 */
export default async function unpack (carPath, opts = {}) {
  if (!carPath) {
    carPath = tmpPath()
    await pipeline(process.stdin, fs.createWriteStream(carPath))
  }

  const reader = await CarIndexedReader.fromFile(carPath)
  const root = await getRoot(reader, opts)

  // @ts-expect-error blockstore not got `has` or `put` but they are unused
  const entries = exporter(root, {
    async get (cid) {
      const block = await reader.get(cid)
      if (!block) {
        console.error(`Missing block: ${cid}`)
        process.exit(1)
      }
      /* c8 ignore next */
      if (opts.verify || opts.verify == null) {
        // @ts-expect-error
        await validateBlock(block)
      }
      return block.bytes
    }
  })

  for await (const entry of entries) {
    if (!opts.output) {
      if (entry.type === 'file' || entry.type === 'raw') {
        await pipeline(entry.content, process.stdout)
        break
      }
      console.error('Not a file - specify output path with --output')
      process.exit(1)
    }

    let filePath = entry.path
    const parts = entry.path.split('/')
    parts[0] = opts.output
    filePath = parts.join('/')

    if (entry.type === 'file' || entry.type === 'raw') {
      await pipeline(entry.content, fs.createWriteStream(filePath))
    } else if (entry.type === 'directory') {
      await fs.promises.mkdir(filePath, { recursive: true })
    /* c8 ignore next 4 */
    } else {
      console.error(`Unsupported UnixFS type ${entry.type} for path: ${entry.path}`)
      process.exit(1)
    }
  }
}
