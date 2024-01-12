import fs from 'fs'
import { pipeline } from 'stream/promises'
import { CarIndexedReader } from '@ipld/car/indexed-reader'
import { UnixFS } from 'ipfs-unixfs'
import * as dagPB from '@ipld/dag-pb'
import * as raw from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import { tmpPath } from './lib/tmp.js'
import { getRoot } from './lib/car.js'

/**
 * @typedef {{ get: (link: import('multiformats').UnknownLink) => Promise<import('multiformats').Block|undefined> }} Blockstore
 * @typedef {import('multiformats').BlockView<dagPB.PBNode, typeof dagPB.code, number, 0|1> & { data: UnixFS }} UnixFSBlockView
 * @typedef {{ type: string, link: import('multiformats').UnknownLink, path: string[] }} Entry
 * @typedef {Entry & { type: 'missing' }} MissingEntry Missing block in CAR.
 * @typedef {Entry & { type: 'directory' }} DirectoryEntry UnixFS directory or HAMT directory.
 * @typedef {Entry & { type: 'file', size: number }} FileEntry UnixFS file.
 * @typedef {Entry & { type: 'data', size: number }} DataEntry Non-dag-pb data.
 */

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
  const root = await getRoot(reader, opts)

  // @ts-expect-error
  for await (const entry of listUnixFS(reader, root)) {
    if (opts.verbose) {
      const size = entry.type === 'directory' ? '-' : entry.type === 'missing' ? '?' : entry.size
      console.log(`${entry.link}\t${size}\t${entry.path.join('/')}${entry.type === 'missing' ? '\t(missing)' : ''}`)
    } else {
      console.log(`${entry.path.join('/')}${entry.type === 'missing' ? '\t(missing)' : ''}`)
    }
  }
}

/**
 * @param {Blockstore} bs 
 * @param {import('multiformats').UnknownLink} link
 * @returns {AsyncIterable<MissingEntry|DataEntry|DirectoryEntry|FileEntry>}
 */
const listUnixFS = async function * (bs, link) {
  const block = await bs.get(link)
  if (!block) {
    yield { link, type: 'missing', path: ['.'] }
    return
  }

  const unixfsBlock = await decodeUnixFS(block)

  if (unixfsBlock.data.type === 'directory') {
    yield { link, type: 'directory', path: ['.'] }
    for await (const entry of listUnixFSDirectory(bs, unixfsBlock)) {
      yield { ...entry, path: ['.', ...entry.path] }
    }
  } else if (unixfsBlock.data.type === 'hamt-sharded-directory') {
    yield { link, type: 'directory', path: ['.'] }
    for await (const entry of listUnixFSShardedDirectory(bs, unixfsBlock)) {
      yield { ...entry, path: ['.', ...entry.path] }
    }
  /* c8 ignore next 3 */
  } else {
    throw new Error(`not a unixfs directory: ${block.cid}`)
  }
}

/**
 * @param {Blockstore} bs
 * @param {UnixFSBlockView} unixfsBlock
 * @returns {AsyncIterable<MissingEntry|DataEntry|DirectoryEntry|FileEntry>}
 */
const listUnixFSDirectory = async function * (bs, unixfsBlock) {
  for (const entry of unixfsBlock.value.Links) {
    const entryBlock = await bs.get(entry.Hash)
    /* c8 ignore next */
    const name = entry.Name ?? ''
    /* c8 ignore next */
    const size = entryBlock ? dagSize(entryBlock) : 0

    if (entryBlock && entry.Hash.code === dagPB.code) {
      const entryUnixFSBlock = await decodeUnixFS(entryBlock)
      if (entryUnixFSBlock.data.type === 'directory') {
        yield { link: entry.Hash, type: 'directory', path: [name] }
        for await (const dirEnt of listUnixFSDirectory(bs, entryUnixFSBlock)) {
          yield { ...dirEnt, path: [name, ...dirEnt.path] }
        }
      /* c8 ignore next 5 */
      } else if (entryUnixFSBlock.data.type === 'hamt-sharded-directory') {
        yield { link: entry.Hash, type: 'directory', path: [name] }
        for await (const dirEnt of listUnixFSShardedDirectory(bs, entryUnixFSBlock)) {
          yield { ...dirEnt, path: [name, ...dirEnt.path] }
        }
      } else if (entryUnixFSBlock.data.type === 'file') {
        yield { link: entry.Hash, type: 'file', path: [name], size: dagSize(entryUnixFSBlock) }
      /* c8 ignore next 3 */
      } else {
        throw new Error(`unsupported UnixFS entry type: ${entryUnixFSBlock.data.type}`)
      }
      continue
    }

    /* c8 ignore next */
    yield { link: entry.Hash, type: entryBlock ? 'data' : 'missing', path: [name], size }
  }
}

/**
 * @param {Blockstore} bs
 * @param {UnixFSBlockView} unixfsBlock
 * @returns {AsyncIterable<MissingEntry|DataEntry|DirectoryEntry|FileEntry>}
 */
const listUnixFSShardedDirectory = async function * (bs, unixfsBlock) {
  /* c8 ignore next 3 */
  if (unixfsBlock.data.fanout == null) {
    throw new Error('not a UnixFS sharded directory: missing fanout')
  }

  const padLength = (unixfsBlock.data.fanout - 1n).toString(16).length

  for (const entry of unixfsBlock.value.Links) {
    const entryBlock = await bs.get(entry.Hash)
    /* c8 ignore next */
    const name = entry.Name != null ? entry.Name.substring(padLength) : ''
    /* c8 ignore next */
    const size = entryBlock ? dagSize(entryBlock) : 0

    if (entryBlock && entry.Hash.code === dagPB.code) {
      const entryUnixFSBlock = await decodeUnixFS(entryBlock)
      if (entryUnixFSBlock.data.type === 'directory') {
        yield { link: entry.Hash, type: 'directory', path: [name] }
        for await (const dirEnt of listUnixFSDirectory(bs, entryUnixFSBlock)) {
          yield { ...dirEnt, path: [name, ...dirEnt.path] }
        }
      /* c8 ignore next 2 */
      } else if (entryUnixFSBlock.data.type === 'hamt-sharded-directory') {
        yield * listUnixFSShardedDirectory(bs, entryUnixFSBlock)
      } else if (entryUnixFSBlock.data.type === 'file') {
        yield { link: entry.Hash, type: 'file', path: [name], size: dagSize(entryUnixFSBlock) }
      /* c8 ignore next 3 */
      } else {
        throw new Error(`unsupported UnixFS entry type: ${entryUnixFSBlock.data.type}`)
      }
      continue
    }

    /* c8 ignore next */
    yield { link: entry.Hash, type: entryBlock ? 'data' : 'missing', path: [name], size }
  }
}

/**
 * @param {import('multiformats').Block} block
 * @returns {Promise<UnixFSBlockView>}
 */
const decodeUnixFS = async block => {
  let pbBlock
  try {
    pbBlock = await Block.create({ cid: block.cid, bytes: block.bytes, codec: dagPB, hasher: sha256 })
  /* c8 ignore next 3 */
  } catch (err) {
    throw new Error(`not a dag-pb node: ${block.cid}`, { cause: err })
  }

  let data
  try {
    /* c8 ignore next */
    if (!pbBlock.value.Data) throw new Error('missing Data')
    data = UnixFS.unmarshal(pbBlock.value.Data)
  /* c8 ignore next 3 */
  } catch (err) {
    throw new Error(`not a unixfs node: ${block.cid}`, { cause: err })
  }

  // @ts-expect-error
  return Object.assign(pbBlock, { data })
}

/** @param {import('multiformats').Block|UnixFSBlockView} block */
const dagSize = block => block.cid.code === raw.code
  ? block.bytes.length
  : 'data' in block
    ? block.data.blockSizes.reduce((total, s) => total + Number(s), 0)
    : 0
