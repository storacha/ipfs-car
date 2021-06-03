import fs from 'fs'
import { expect } from 'chai'
import { CID } from 'multiformats'
import { CarReader } from '@ipld/car'

import { fromCar } from '../../dist/unpack'
import { unpackToFs, unpackStreamToFs } from '../../dist/unpack/fs'

const rawCidString = 'bafkreigk2mcysiwgmacvilb3q6lcdaq53zlwu3jn4pj6qev2lylyfbqfdm'
const rawCid = CID.parse(rawCidString)

const dirTmp = `${__dirname}/tmp`

describe('fromCar', () => {
  it('file system stream', async () => {
    const inStream = fs.createReadStream(`${__dirname}/../fixtures/raw.car`)
    const carReader = await CarReader.fromIterable(inStream)
    const files = []

    for await (const file of fromCar(carReader)) {
      expect(file.path).to.eql(rawCidString)
      expect(rawCid.equals(file.cid)).to.eql(true)
      files.push(file)
    }

    expect(files).to.have.lengthOf(1)
  })
})

describe('unpackStreamToFs', () => {
  beforeEach(() => {
    if (!fs.existsSync(dirTmp)) {
      fs.mkdirSync(dirTmp)
    }
  })

  afterEach(() => {
    fs.rmdirSync(dirTmp, { recursive: true })
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
    fs.rmdirSync(dirTmp, { recursive: true })
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
