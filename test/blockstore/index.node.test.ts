import { expect } from 'chai'

import { CID } from 'multiformats'
import equals from 'uint8arrays/equals'
import all from 'it-all'

import { Blockstore as BlockstoreInterface } from '../../dist/blockstore'
import { MemoryBlockStore } from '../../dist/blockstore/memory'
import { FsBlockStore } from '../../dist/blockstore/fs'

describe('blockstore', () => {
  [MemoryBlockStore, FsBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      let blockstore: BlockstoreInterface
      const cid = CID.parse('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y')
      const bytes = new Uint8Array([21, 31])

      beforeEach(() => {
        blockstore = new Blockstore()
      })

      afterEach(() => blockstore.destroy())

      it('can put and get', async () => {
        await blockstore.put({ cid, bytes })
        const storedBlock = await blockstore.get(cid)

        expect(cid.equals(storedBlock.cid)).eql(true)
        expect(equals(bytes, storedBlock.bytes)).eql(true)
      })

      it('can iterate on stored blocks', async () => {
        await blockstore.put({ cid, bytes })
        const blocks = await all(blockstore.blocks())

        expect(blocks.length).eql(1)
        expect(cid.equals(blocks[0].cid)).eql(true)
        expect(equals(bytes, blocks[0].bytes)).eql(true)
      })
    })
  })
})
