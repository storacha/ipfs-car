import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import process from 'process'
import all from 'it-all'
import { equals } from 'uint8arrays/equals'

import { CarReader } from '@ipld/car'
import { File } from '@web-std/file'

import { pack } from '../../src/pack'
import { unpack } from '../../src/unpack'
import { packToFs } from '../../src/pack/fs'
import { packToStream } from '../../src/pack/stream'
import { packToBlob } from '../../src/pack/blob'

import { MemoryBlockStore } from '../../src/blockstore/memory'
import { FsBlockStore } from '../../src/blockstore/fs'

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
        try {
          fs.rmSync(dirTmp, { recursive: true })
        } catch (e) {
          // Windows Workers in CI _sometimes_ fail with permissions
        }
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

        await blockstore.close()

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(3)
      })

      it('pack dir to car with filesystem output', async () => {
        const blockstore = new Blockstore()
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/dir`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore
        })

        await blockstore.close()

        const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(3)
      })

      it('pack raw file to car with filesystem output', async () => {
        const blockstore = new Blockstore()
        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          output: `${__dirname}/tmp/raw.car`,
          blockstore
        })

        await blockstore.close()

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[files.length - 1].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('pack raw file to car without output', async () => {
        const blockstore = new Blockstore()

        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          blockstore
        })
        await blockstore.close()

        const newCarPath = `${process.cwd()}/file.car`

        const inStream = fs.createReadStream(newCarPath)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[files.length - 1].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)

        // Remove created file
        try {
          fs.rmSync(newCarPath)
        } catch (e) {
          // Windows Workers in CI _sometimes_ fail with permissions
        }
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
        await blockstore.close()

        const inStream = fs.createReadStream(`${__dirname}/tmp/raw.car`)
        const carReader = await CarReader.fromIterable(inStream)
        const files = await all(unpack(carReader))

        expect(files).to.have.lengthOf(2)

        const rawOriginalContent = new Uint8Array(fs.readFileSync(`${__dirname}/../fixtures/file.raw`))
        const rawContent = (await all(files[files.length - 1].content()))[0]

        expect(equals(rawOriginalContent, rawContent)).to.eql(true)
      })

      it('packToStream does not close provided blockstore', async () => {
        const writable = fs.createWriteStream(`${__dirname}/tmp/raw.car`)
        const blockstore = new Blockstore()

        const spy = sinon.spy(blockstore, 'close')

        // Create car from file
        await packToStream({
          input: `${__dirname}/../fixtures/dir`,
          writable,
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.close()
      })

      it('packToFs does not close provided blockstore', async () => {
        const blockstore = new Blockstore()
        const spy = sinon.spy(blockstore, 'close')

        // Create car from file
        await packToFs({
          input: `${__dirname}/../fixtures/file.raw`,
          output: `${__dirname}/tmp/dir.car`,
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.close()
      })

      it('can packToBlob', async () => {
        const blockstore = new Blockstore()

        const { car, root } = await packToBlob({
          input: [new Uint8Array([21, 31])],
          blockstore
        })

        expect(car).to.exist
        expect(root.toString()).to.eql('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
        await blockstore.close()
      })

      it('can packToBlob Web File', async () => {
        const blockstore = new Blockstore()

        const file = new File([new Uint8Array([1, 2, 3])], 'file.txt')
        const { car, root } = await packToBlob({
          input: [file],
          blockstore
        })

        expect(car).to.exist
        expect(root.toString()).to.eql('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
        await blockstore.close()
      })

      it('should error to pack empty input', async () => {
        const blockstore = new Blockstore()

        try {
          await pack({
            input: [],
            blockstore
          })
        } catch (err) {
          expect(err).to.exist
          return
        }
        throw new Error('pack should throw error with empty input')
      })

      it('can create a DAG with non-raw leaf nodes allowing downgradable CID', async () => {
        const { root } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore(),
          rawLeaves: false,
          wrapWithDirectory: false
        })

        expect(() => root.toV0()).to.not.throw()
        expect(root.toV0().toString()).to.eql('QmNUCKvjKRFeHZR2wyYM5cPEbEB969hz2zowTYvwGrQXP2')
      })

      it('can create a v0 CID', async () => {
        const { root } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore(),
          wrapWithDirectory: false,
          cidVersion: 0
        })

        expect(root.toString()).to.eql('QmNUCKvjKRFeHZR2wyYM5cPEbEB969hz2zowTYvwGrQXP2')
      })
    })
  })
})
