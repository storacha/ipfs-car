import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import process from 'process'
import all from 'it-all'
import equals from 'uint8arrays/equals'

import { CarReader } from '@ipld/car'

import { pack } from '../../dist/pack'
import { unpack } from '../../dist/unpack'
import { packToFs } from '../../dist/pack/fs'
import { packToStream } from '../../dist/pack/stream'
import { packToBlob } from '../../dist/pack/blob'

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

      it('can pack from a readable stream', async () => {
        const { out } = await pack({
          input: fs.createReadStream(`${__dirname}/../fixtures/file.raw`)
        })

        const carParts = []
        for await (const part of out) {
          carParts.push(part)
        }

        expect(carParts.length).to.not.eql(0)
      })

      it('pack dir to car with filesystem output with iterable input', async () => {
        const blockstore = new Blockstore()
        const writable = fs.createWriteStream(`${__dirname}/tmp/dir.car`)
        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/dir`,
          writable,
          blockstore
        })

        await blockstore.destroy()

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack dir to car with filesystem output', async () => {
        const blockstore = new Blockstore()
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/dir`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore
        })

        await blockstore.destroy()

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)
      })

      it('pack raw file to car with filesystem output', async () => {
        const blockstore = new Blockstore()
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          output: `${__dirname}/tmp/raw.car`,
          blockstore
        })

        await blockstore.destroy()

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(1)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[0].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('pack raw file to car without output', async () => {
        const blockstore = new Blockstore()

        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          blockstore
        })
        await blockstore.destroy()

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
        const blockstore = new Blockstore()
        const writable = fs.createWriteStream(`${__dirname}/tmp/raw.car`)

        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/file.raw`,
          writable,
          blockstore
        })
        await blockstore.destroy()

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

      it('can packToBlob', async () => {
        const blockstore = new Blockstore()

        const { car, root } = await packToBlob({
          input: [new Uint8Array([21, 31])],
          blockstore
        })

        expect(car).to.exist
        expect(root.toString()).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y')
        await blockstore.destroy()
      })
    })
  })
})
