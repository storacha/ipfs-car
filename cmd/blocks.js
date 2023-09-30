import fs from 'fs'
import { validateBlock } from '@web3-storage/car-block-validator'
import { CarBlockIterator } from '@ipld/car/iterator'

/**
 * @param {string} carPath
 * @param {object} [opts]
 * @param {boolean} [opts.verify]
 */
export default async function blocksList (carPath, opts) {
  const blocks = await CarBlockIterator.fromIterable(carPath ? fs.createReadStream(carPath) : process.stdin)
  for await (const block of blocks) {
    /* c8 ignore next */
    if (opts?.verify || opts?.verify == null) {
      // @ts-expect-error
      await validateBlock(block)
    }
    console.log(block.cid.toString())
  }
}
