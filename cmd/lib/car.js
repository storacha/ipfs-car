import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { decode as blockDecode } from 'multiformats/block'
import { Codecs } from './codec.js'

/**
 * @param {import('@ipld/car/api').CarReader} reader
 * @param {object} [opts]
 * @param {string} [opts.root]
 */
export async function getRoot (reader, opts = {}) {
  let roots = opts.root ? [CID.parse(opts.root)] : await reader.getRoots()
  if (!roots.length) {
    roots = await findImplicitRoots(reader.blocks())
  }
  if (roots.length > 1) {
    console.error(`Multiple roots found, use --root to specify which one to use:\n${roots.join('\n')}`)
    process.exit(1)
  }
  return roots[0]
}

/** @param {AsyncIterable<import('@ipld/car/api').Block>} blocks */
export async function findImplicitRoots (blocks) {
  const notRoots = new Set()
  const roots = new Set()

  for await (const { cid, bytes } of blocks) {
    if (!notRoots.has(cid.toString())) {
      roots.add(cid.toString())
    }

    const decoder = Codecs[cid.code]
    /* c8 ignore next 4 */
    if (!decoder) {
      console.error(`Missing decoder: ${cid.code}`)
      process.exit(1)
    }

    const block = await blockDecode({ bytes, codec: decoder, hasher: sha256 })
    for (const [, linkCID] of block.links()) {
      if (roots.has(linkCID.toString())) {
        roots.delete(linkCID.toString())
      }
      notRoots.add(cid.toString())
    }
  }

  return Array.from(roots).map(s => CID.parse(s))
}
