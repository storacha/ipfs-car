import fs from 'fs'
import path from 'path'
import { Readable, Writable } from 'stream'
import { filesFromPaths } from 'files-from-path'
import { CarWriter } from '@ipld/car/writer'
import { CID } from 'multiformats/cid'
import * as UnixFS from '../unixfs.js'
import { CAREncoderStream } from '../car.js'

/** Root CID written in CAR file header before it is updated with the real root CID. */
const placeholderCID = CID.parse('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')

/**
 * @param {string} filePath
 * @param {object} opts
 * @param {string[]} opts._
 * @param {string} [opts.file]
 * @param {boolean} [opts.wrap]
 * @param {boolean} [opts.hidden]
 * @param {string} [opts.output]
 */
export default async function pack (filePath, opts) {
  const paths = checkPathsExist([filePath, ...opts._].filter(Boolean))
  const hidden = !!opts.hidden
  const files = paths.length
    ? await filesFromPaths(paths, { hidden })
    : /** @type {import('../types').FileLike[]} */ ([{ name: 'stdin', stream: () => Readable.toWeb(process.stdin) }])
  const blockStream = files.length === 1 && (files[0].name === 'stdin' || !opts.wrap)
    ? UnixFS.createFileEncoderStream(files[0])
    : UnixFS.createDirectoryEncoderStream(files)
  const carEncoderStream = new CAREncoderStream(opts.output ? [placeholderCID] : [])
  const outStream = Writable.toWeb(opts.output ? fs.createWriteStream(opts.output) : process.stdout)
  await blockStream.pipeThrough(carEncoderStream).pipeTo(outStream)
  const rootCID = carEncoderStream.finalBlock?.cid
  /* c8 ignore next */
  if (!rootCID) throw new Error('no blocks in CAR')
  if (opts.output) {
    const fd = await fs.promises.open(opts.output, 'r+')
    // @ts-expect-error
    await CarWriter.updateRootsInFile(fd, [rootCID])
    await fd.close()
  }
  console.error(rootCID.toString())
}

/** @param {string[]} paths */
function checkPathsExist (paths) {
  for (const p of paths) {
    if (!fs.existsSync(p)) {
      console.error(`The path ${path.resolve(p)} does not exist`)
      process.exit(1)
    }
  }
  return paths
}
