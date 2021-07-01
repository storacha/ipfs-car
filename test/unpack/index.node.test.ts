import fs from 'fs'
import { expect } from 'chai'
import { CID } from 'multiformats'
import { CarReader } from '@ipld/car'

import { unpack, unpackStream } from '../../src/unpack'
import { unpackToFs, unpackStreamToFs } from '../../src/unpack/fs'

import { MemoryBlockStore } from '../../src/blockstore/memory'
import { FsBlockStore } from '../../src/blockstore/fs'

const rawCidString = 'bafkreigk2mcysiwgmacvilb3q6lcdaq53zlwu3jn4pj6qev2lylyfbqfdm'
const rawCid = CID.parse(rawCidString)

const dirTmp = `${__dirname}/tmp`

describe('unpack', () => {
  it('file system stream', async () => {
    const inStream = fs.createReadStream(`${__dirname}/../fixtures/raw.car`)
    const carReader = await CarReader.fromIterable(inStream)
    const files = []

    for await (const file of unpack(carReader)) {
      expect(file.path).to.eql(rawCidString)
      expect(rawCid.equals(file.cid)).to.eql(true)
      files.push(file)
    }

    expect(files).to.have.lengthOf(1)
  })
})

describe('unpackStream', () => {
  [FsBlockStore, MemoryBlockStore].map((Blockstore) => {
    it('file system stream', async () => {
      const inStream = fs.createReadStream(`${__dirname}/../fixtures/raw.car`)
      const files = []

      for await (const file of unpackStream(inStream, {blockstore: new Blockstore()})) {
        expect(file.path).to.eql(rawCidString)
        expect(rawCid.equals(file.cid)).to.eql(true)
        files.push(file)
      }
      expect(files).to.have.lengthOf(1)
    })
  })
})

describe('unpackStreamToFs', () => {
  beforeEach(() => {
    if (!fs.existsSync(dirTmp)) {
      fs.mkdirSync(dirTmp)
    }
  })

  afterEach(() => {
    fs.rmSync(dirTmp, { recursive: true })
  })

  it('raw file stream', async () => {
    const input = fs.createReadStream(`${__dirname}/../fixtures/raw.car`)
    const output = `${__dirname}/tmp/raw`

    await unpackStreamToFs({
      input,
      output
    })

    expect(fs.existsSync(output)).to.eql(true)
  })

  it('file system dir', async () => {
    const input = fs.createReadStream(`${__dirname}/../fixtures/dir.car`)
    const output = `${__dirname}/tmp/dir`

    await unpackStreamToFs({
      input,
      output
    })

    expect(fs.existsSync(output)).to.eql(true)
  })
})

describe('unpackToFs', () => {
  beforeEach(() => {
    if (!fs.existsSync(dirTmp)) {
      fs.mkdirSync(dirTmp)
    }
  })

  afterEach(() => {
    fs.rmSync(dirTmp, { recursive: true })
  })

  it('file system raw', async () => {
    const output = `${__dirname}/tmp/raw`

    await unpackToFs({
      input: `${__dirname}/../fixtures/raw.car`,
      output
    })

    expect(fs.existsSync(output)).to.eql(true)
  })

  it('file system dir', async () => {
    const output = `${__dirname}/tmp/dir`

    await unpackToFs({
      input: `${__dirname}/../fixtures/dir.car`,
      output
    })

    expect(fs.existsSync(output)).to.eql(true)
  })
})
