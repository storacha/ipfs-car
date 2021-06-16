import { expect } from 'chai'
import concat from 'uint8arrays/concat'
import all from 'it-all'
import { CarReader } from '@ipld/car'

import { pack } from 'ipfs-car/pack'
import { unpack } from 'ipfs-car/unpack'

import { MemoryBlockStore } from 'ipfs-car/blockstore/memory'

describe('unpack', () => {
  [MemoryBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      it('with iterable input', async () => {
        const { out } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore()
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
  })
})
