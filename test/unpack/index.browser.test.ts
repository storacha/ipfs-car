import { expect } from 'chai'
import concat from 'uint8arrays/concat'
import all from 'it-all'
import { CarReader } from '@ipld/car'

import { pack } from '../../src/pack'
import { unpack, unpackStream } from '../../src/unpack'

import { MemoryBlockStore } from '../../src/blockstore/memory'
import { IdbBlockStore } from '../../src/blockstore/idb'

describe('unpack', () => {
  it('with iterable input', async () => {
    const { out } = await pack({
      input: [new Uint8Array([21, 31])],
      blockstore: new MemoryBlockStore()
    })

    let bytes = new Uint8Array([])
    for await (const part of out) {
      bytes = concat([bytes, new Uint8Array(part)])
    }

    const carReader = await CarReader.fromBytes(bytes)
    const files = await all(unpack(carReader))

    expect(files.length).to.eql(1)
    expect(files[0].type).to.eql('raw')
    expect(files[0].name).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y')
  })
})

describe('unpackStream', () => {
  [IdbBlockStore, MemoryBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      it('with iterable input', async () => {
        const { out } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new MemoryBlockStore()
        })
        const files = await all(unpackStream(out, {blockstore: new Blockstore()}))
        expect(files.length).to.eql(1)
        expect(files[0].type).to.eql('raw')
        expect(files[0].name).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y')
      })
    })
  })
})
