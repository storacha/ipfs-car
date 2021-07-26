import { expect } from 'chai'
import sinon from 'sinon'
import { sha512 } from 'multiformats/hashes/sha2'

import { pack } from '../../src/pack'
import { packToBlob } from '../../src/pack/blob'
import { MemoryBlockStore } from '../../src/blockstore/memory'

describe('pack', () => {
  [MemoryBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      it('with iterable input', async () => {
        const { root, out } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore()
        })

        const carParts = []
        for await (const part of out) {
          carParts.push(part)
        }

        expect(root.toString()).to.eql('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
        expect(carParts.length).to.eql(7)
      })

      it('can pack with custom unixfs importer options', async () => {
        const { root, out } = await pack({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore(),
          hasher: sha512,
          maxChunkSize: 1048576,
          maxChildrenPerNode: 1024,
          wrapWithDirectory: false
        })

        const carParts = []
        for await (const part of out) {
          carParts.push(part)
        }

        expect(root.toString()).to.eql('bafkrgqdqehl5lkv4gfiooickxq4ikjacq6n34aczh7ga4euh46zqxgp2dvszwyxi5262v6rkv55pwi5m5yvd6kwxpxr36ipk7pu2mk3pnsnms')
        expect(carParts.length).to.eql(4)
      })

      it('returns a car blob', async () => {
        const { root, car } = await packToBlob({
          input: [new Uint8Array([21, 31])],
          blockstore: new Blockstore()
        })

        expect(root.toString()).to.eql('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
      })

      it('pack does not close provided blockstore', async () => {
        const blockstore = new Blockstore()
        const spy = sinon.spy(blockstore, 'close')

        await pack({
          input: [new Uint8Array([21, 31])],
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.close()
      })

      it('packToBlob does not close provided blockstore', async () => {
        const blockstore = new Blockstore()
        const spy = sinon.spy(blockstore, 'close')

        await packToBlob({
          input: [new Uint8Array([21, 31])],
          blockstore
        })

        expect(spy.callCount).to.eql(0)
        await blockstore.close()
      })
    })
  })
})
