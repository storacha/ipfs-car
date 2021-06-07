import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import process from 'process'
import all from 'it-all'
import equals from 'uint8arrays/equals'

import { CarReader } from '@ipld/car'

import { unpack } from '../../dist/unpack'
import { packToFs } from '../../dist/pack/fs'
import { packToStream } from '../../dist/pack/stream'

import { MemoryBlockStore } from '../../dist/blockstore/memory'
import { FsBlockStore } from '../../dist/blockstore/fs'

const dirTmp = `${__dirname}/tmp`

describe('pack', () => {
  ;[MemoryBlockStore, FsBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      beforeEach(() => {
        if(!fs.existsSync(dirTmp)) {
          fs.mkdirSync(dirTmp)
        }
      })

      afterEach(() => {
        fs.rmSync(dirTmp, { recursive: true })
      })

      it('pack dir to car with filesystem output with iterable input', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/dir.car`)
        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/dir`,
          writable,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack dir to car with filesystem output', async () => {
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/dir`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack raw file to car with filesystem output', async () => {
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          output: `${__dirname}/tmp/raw.car`,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('pack raw file to car without output', async () => {
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          blockstore: new Blockstore()
        })
        const newCarPath = `${process.cwd()}/file.car`

        const inStream = fs.createReadStream(newCarPath)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)

        // Remove created file
        fs.rmSync(newCarPath)
      })

      it('pack raw file to car with writable stream', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/raw.car`)

        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/file.raw`,
          writable,
          blockstore: new Blockstore()
        })

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('packToStream does not destroy provided blockstore', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/raw.car`)
        const blockstore = new Blockstore()

        const spy = sinon.spy(blockstore, 'destroy')

        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/dir`,
          writable,
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.destroy()
      })

      it('packToFs does not destroy provided blockstore', async () => {
        const blockstore = new Blockstore()
        const spy = sinon.spy(blockstore, 'destroy')

        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.destroy()
      })
    })
  })
})
