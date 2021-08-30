import { expect } from 'chai'
import { concat } from 'uint8arrays/concat'
import all from 'it-all'
import { CarReader } from '@ipld/car'

import { pack } from '../../src/pack'
import { unpack, unpackStream } from '../../src/unpack'

import { MemoryBlockStore } from '../../src/blockstore/memory'
import { IdbBlockStore } from '../../src/blockstore/idb'

describe('unpack', () => {
  it('with CarReader input', async () => {
    const { out } = await pack({
      input: [{
        path: 'a.txt',
        content: new Uint8Array([21, 31])
      }],
      blockstore: new MemoryBlockStore()
    })

    let bytes = new Uint8Array([])
    let carParts = []
    for await (const part of out) {
      carParts.push(part)
      bytes = concat([bytes, new Uint8Array(part)])
    }

    const carReader = await CarReader.fromBytes(bytes)
    const files = await all(unpack(carReader))

    expect(files.length).to.eql(2)
    expect(files[0].type).to.eql('directory')
    expect(files[0].name).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu')
    expect(files[1].type).to.eql('raw')
    expect(files[1].name).to.eql('a.txt')
    expect(files[1].path).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu/a.txt')
  })
})

describe('unpackStream', () => {
  [IdbBlockStore, MemoryBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      it('with iterable input', async () => {
        const { out } = await pack({
          input: [{
            path: 'a.txt',
            content: new Uint8Array([21, 31])
          }],
          blockstore: new MemoryBlockStore()
        })
        const files = await all(unpackStream(out, {blockstore: new Blockstore()}))
        expect(files.length).to.eql(2)
        expect(files[0].type).to.eql('directory')
        expect(files[0].name).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu')
        expect(files[1].type).to.eql('raw')
        expect(files[1].name).to.eql('a.txt')
        expect(files[1].path).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu/a.txt')
      })
      it('with readablestream input', async () => {
        const { out } = await pack({
          input: [{
            path: 'a.txt',
            content: new Uint8Array([21, 31])
          }],
          blockstore: new MemoryBlockStore()
        })
        const stream = new ReadableStream({
          async pull(controller) {
            for await (const chunk of out) {
              controller.enqueue(chunk)
            }
            controller.close()
          }
        })
        const files = await all(unpackStream(stream, {blockstore: new Blockstore()}))
        expect(files.length).to.eql(2)
        expect(files[0].type).to.eql('directory')
        expect(files[0].name).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu')
        expect(files[1].type).to.eql('raw')
        expect(files[1].name).to.eql('a.txt')
        expect(files[1].path).to.eql('bafybeiglo54z2343qksf253l2xtsik3n4kdguwtfayhhtn36btqrnlwrsu/a.txt')
      })
    })
  })
})
