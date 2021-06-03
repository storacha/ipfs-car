import { expect } from 'chai'
import stream from 'stream'
import concat from 'uint8arrays/concat'

import { fromCar } from '../dist/from-car'

import {
  packFileIterableToCar,
  toCar
} from '../dist/to-car'

import { MemoryBlockStore } from '../dist/blockstore/memory'
import { LevelBlockStore } from '../dist/blockstore/level'

describe('toCar', () => {
  [MemoryBlockStore, LevelBlockStore].map((Blockstore) => {
    describe(`with ${Blockstore.name}`, () => {
      it('pack dir to car', async () => {
        let bytes = new Uint8Array([])

        const writable = new stream.Writable({
          write(chunk, _, next) {
            bytes = concat([bytes, new Uint8Array(chunk)])
            next()
          }
        })
        // Create car from file
        await packFileIterableToCar({
          input: `${__dirname}/fixtures/dir`,
          writable,
          blockstore: new Blockstore()
        })

        // const inStream = fs.createReadStream(`${__dirname}/tmp/dir.car`)
        // const carReader = await CarReader.fromIterable(inStream)
        // const files = await all(fromCar(carReader))

        // expect(files).to.have.lengthOf(2)
      })
    })
  })
})