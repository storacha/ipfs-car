/* eslint-env mocha, browser */
import assert from 'assert'
import { CID } from 'multiformats/cid'
import { sha512 } from 'multiformats/hashes/sha2'
import { CarReader } from '@ipld/car'
import { configure, UnixFSLeaf } from '@ipld/unixfs'
import { withMaxChunkSize } from '@ipld/unixfs/file/chunker/fixed'
import { withWidth } from '@ipld/unixfs/file/layout/balanced'
import * as raw from 'multiformats/codecs/raw'
import { createFileEncoderStream, createDirectoryEncoderStream, CAREncoderStream } from '../index.js'

describe('pack', () => {
  it('can pack file', async () => {
    const data = new Uint8Array([21, 31])
    const input = createFileEncoderStream(new Blob([data]))
    const encoder = new CAREncoderStream()

    const carParts = []
    await input.pipeThrough(encoder).pipeTo(new WritableStream({
      write: (part) => { carParts.push(part) }
    }))

    const root = encoder.finalBlock?.cid
    assert(root)
    assert.equal(root.toString(), 'bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y')

    const reader = await CarReader.fromBytes(new Uint8Array(await new Blob(carParts).arrayBuffer()))
    const blocks = []
    for await (const block of reader.blocks()) {
      blocks.push(block)
    }

    assert.deepEqual(blocks.map(b => b.cid.toString()), [
      'bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y'
    ])
  })

  it('can pack directory', async () => {
    const data = [
      new Uint8Array([21, 31]),
      new Uint8Array([41, 51])
    ]
    const input = createDirectoryEncoderStream(data.map((d, i) => {
      return Object.assign(new Blob([d]), { name: `./memes/cat${i}.gif` })
    }))
    const encoder = new CAREncoderStream()

    const carParts = []
    await input.pipeThrough(encoder).pipeTo(new WritableStream({
      write: (part) => { carParts.push(part) }
    }))

    const root = encoder.finalBlock?.cid
    assert(root)
    assert.equal(root.toString(), 'bafybeihkflpnvj3ai5kgow6ut6apir74w7crmqsks7jp6wb3qkthebciwq')

    const reader = await CarReader.fromBytes(new Uint8Array(await new Blob(carParts).arrayBuffer()))
    const blocks = []
    for await (const block of reader.blocks()) {
      blocks.push(block)
    }

    assert.deepEqual(blocks.map(b => b.cid.toString()), [
      'bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y',
      'bafkreig252blsxbz3t2v5dxsoutt4ctehep3c6bnhcap2yndyjhwmnyk4y',
      'bafybeidwuiczcdtqsyqln5fgifl3fbblpclb573ltn4id5w5woffucor5a',
      'bafybeihkflpnvj3ai5kgow6ut6apir74w7crmqsks7jp6wb3qkthebciwq'
    ])
  })

  it('can pack with custom unixfs importer options', async () => {
    const data = new Uint8Array(30000).fill(1)
    const input = createFileEncoderStream(new Blob([data]), configure({
      chunker: withMaxChunkSize(10000),
      hasher: sha512,
      fileLayout: withWidth(2),
      fileChunkEncoder: raw
    }))
    const encoder = new CAREncoderStream()

    const carParts = []
    await input.pipeThrough(encoder).pipeTo(new WritableStream({
      write: (part) => { carParts.push(part) }
    }))

    const root = encoder.finalBlock?.cid
    assert(root)
    assert.equal(root.toString(), 'bafybgqe6my4qso7fpw7apm3eujliffglmuue3x4qlzrzznumqafs3abkl477ykzbvmf6o6nbwhpskawhs4hyapr67a3plu35s2a4fmvyzhwdc')

    const reader = await CarReader.fromBytes(new Uint8Array(await new Blob(carParts).arrayBuffer()))
    const blocks = []
    for await (const block of reader.blocks()) {
      blocks.push(block)
    }

    assert.deepEqual(blocks.map(b => b.cid.toString()), [
      'bafkrgqc5ycyu7sdqaz23gksdakcyn7glczjkirheelioli33thyzkyuw4dmwiwwsbitswvzydion2ifxtavz7duzpw54elq4eh5afdd7bp43m',
      'bafkrgqc5ycyu7sdqaz23gksdakcyn7glczjkirheelioli33thyzkyuw4dmwiwwsbitswvzydion2ifxtavz7duzpw54elq4eh5afdd7bp43m',
      'bafkrgqc5ycyu7sdqaz23gksdakcyn7glczjkirheelioli33thyzkyuw4dmwiwwsbitswvzydion2ifxtavz7duzpw54elq4eh5afdd7bp43m',
      'bafybgqhlhp5s4ui3jnogb5ctznpb67qzp3narend7ju3x66ke7w5lhmbj2xz3d4kiovglvdlfi4ltfmle3mvnjhddgum2tektq6nfxa6db7mu',
      'bafybgqcxwdhw5ot2bbdjvctuvkrlq6otukcc3zykqazl2jxwhxejkam3gqptzjow3eenoilbne25vlxqsmkf6hftayvyl664bd5nbhsvoyhf6',
      'bafybgqe6my4qso7fpw7apm3eujliffglmuue3x4qlzrzznumqafs3abkl477ykzbvmf6o6nbwhpskawhs4hyapr67a3plu35s2a4fmvyzhwdc'
    ])
  })

  it('can create a DAG with non-raw leaf nodes allowing downgradable CID', async () => {
    const data = new Uint8Array([21, 31])
    const input = createFileEncoderStream(new Blob([data]), configure({ fileChunkEncoder: UnixFSLeaf }))
    const encoder = new CAREncoderStream()

    const carParts = []
    await input.pipeThrough(encoder).pipeTo(new WritableStream({
      write: (part) => { carParts.push(part) }
    }))

    const root = CID.asCID(encoder.finalBlock?.cid)
    assert(root)
    assert.doesNotThrow(() => root.toV0())
    assert.equal(root.toV0().toString(), 'QmNUCKvjKRFeHZR2wyYM5cPEbEB969hz2zowTYvwGrQXP2')
  })

  it('throws when treating a file as a directory', async () => {
    assert.throws(() => createDirectoryEncoderStream([
      Object.assign(new Blob([]), { name: 'fileNotADir' }),
      Object.assign(new Blob([]), { name: 'fileNotADir/file.txt' })
    ]), /cannot be a file and a directory/)
  })
})
