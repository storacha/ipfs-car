import fs from 'fs'
import { CarCIDIterator } from '@ipld/car/iterator'

/** @param {string} carPath */
export default async function blocksList (carPath) {
  const cids = await CarCIDIterator.fromIterable(carPath ? fs.createReadStream(carPath) : process.stdin)
  for await (const cid of cids) {
    console.log(cid.toString())
  }
}
