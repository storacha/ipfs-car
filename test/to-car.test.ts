import { expect } from 'chai'
import fs from 'fs'
import all from 'it-all'
const equals = require('uint8arrays/equals')

import { CarReader } from '@ipld/car'

import {
  fromCar,
} from '../dist/from-car'

import {
  packFileToCar,
  toCar
} from '../dist/to-car'

const dirTmp = `${__dirname}/tmp`

describe('toCar', () => {
  beforeEach(() => {
    if (!fs.existsSync(dirTmp)) {
      fs.mkdirSync(dirTmp)
    }
  })

  afterEach(() => {
    fs.rmdirSync(dirTmp, { recursive: true })
  })

  it('read a raw car file and transform it back toCar', async () => {
    const inStream = fs.createReadStream(`${__dirname}/fixtures/raw.car`)
    const carReader = await CarReader.fromIterable(inStream)
    const files = await all(fromCar(carReader))

    expect(files).to.have.lengthOf(1)

    await toCar({
      files,
      writable: fs.createWriteStream(`${__dirname}/tmp/raw.car`)
    })
  })

  it('pack raw file to car', async () => {
    // Create car from file
    await packFileToCar({
      input: `${__dirname}/fixtures/file.raw`,
      output: `${__dirname}/tmp/raw2.car`
    })

    const inStream = fs.createReadStream(`${__dirname}/tmp/raw2.car`)
    const carReader = await CarReader.fromIterable(inStream)
    const files = await all(fromCar(carReader))

    expect(files).to.have.lengthOf(1)

    const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/fixtures/file.raw`))
    const rawContent = (await all(files[0].content()))[0]
    
    expect(equals(rawOriginalContent, rawContent)).to.eql(true)
  })
})
