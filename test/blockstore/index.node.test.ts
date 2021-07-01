import { expect } from 'chai'

import { CID } from 'multiformats'
import equals from 'uint8arrays/equals'
import all from 'it-all'

import { Blockstore as BlockstoreInterface } from '../../src/blockstore'
import { MemoryBlockStore } from '../../src/blockstore/memory'
import { FsBlockStore } from '../../src/blockstore/fs'

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
        if (!storedBlock) {
          expect.fail("should return a block");
        }
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

      it('can put several blocks in parallel', async () => {
        const cid2 = CID.parse('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby5y')
        const cid3 = CID.parse('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby6y')

        await Promise.all([
          blockstore.put({ cid, bytes }),
          blockstore.put({ cid: cid2, bytes }),
          blockstore.put({ cid: cid3, bytes })
        ])

        const blocks = await all(blockstore.blocks())
        expect(blocks.length).eql(3)
      })

      it('can destroy immediately after creating', () => {
        // Do nothing, rely on beforeEach and afterEach
      })
    })
  })
})
