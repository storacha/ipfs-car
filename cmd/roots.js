import fs from 'fs'
import { CarBlockIterator } from '@ipld/car'
import { findImplicitRoots } from './lib/car.js'

/**
 * @param {string} carPath
 * @param {object} [opts]
 * @param {boolean} [opts.implicit]
 */
export default async function rootsList (carPath, opts = {}) {
  const blocks = await CarBlockIterator.fromIterable(carPath ? fs.createReadStream(carPath) : process.stdin)
  const roots = opts.implicit
    ? await findImplicitRoots(blocks)
    : await blocks.getRoots()
  roots.forEach(r => console.log(r.toString()))
}
