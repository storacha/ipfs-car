import { expect } from 'chai'
import fs from 'fs'
import process from 'process'
import all from 'it-all'
const equals = require('uint8arrays/equals')

import { CarReader } from '@ipld/car'

import { fromCar } from '../dist/from-car'

import {
  packFileIterableToCar,
  packFileToCarFs,
  toCar
} from '../dist/to-car'

import { MemoryBlockStore } from '../dist/blockstore/memory'
import { FsBlockStore } from '../dist/blockstore/fs'
import { LevelBlockStore } from '../dist/blockstore/level'

const dirTmp = `${__dirname}/tmp`

describe('toCar', () => {
  describe('toCar basic', () => {
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
  })

  ;[MemoryBlockStore, FsBlockStore, LevelBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      beforeEach(() => {
          if(!fs.existsSync(dirTmp)) {
          fs.mkdirSync(dirTmp)
        }
      })

      afterEach(() => {
        fs.rmdirSync(dirTmp, { recursive: true })
      })

      it('pack dir to car with filesystem output with iterable input', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/dir.car`)
        // Create car from file
        await packFileIterableToCar({
          input: `${__dirname}/fixtures/dir`,
          writable,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(fromCar(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack dir to car with filesystem output', async () => {
        // Create car from file
        await packFileToCarFs({
          input: `${__dirname}/fixtures/dir`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(fromCar(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack raw file to car with filesystem output', async () => {
        // Create car from file
        await packFileToCarFs({
          input: `${__dirname}/fixtures/file.raw`,
          output: `${__dirname}/tmp/raw.car`,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(fromCar(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('pack raw file to car without output', async () => {
        // Create car from file
        await packFileToCarFs({
          input: `${__dirname}/fixtures/file.raw`,
          blockstore: new Blockstore()
        })
        const newCarPath = `${process.cwd()}/file.car`

        const inStream = fs.createReadStream(newCarPath)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(fromCar(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)

        // Remove created file
        fs.rmSync(newCarPath)
      })

      it('pack raw file to car with writable stream', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/raw.car`)

        // Create car from file
        await packFileIterableToCar({
          input: `${__dirname}/fixtures/file.raw`,
          writable,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(fromCar(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })
    })
  })
})
