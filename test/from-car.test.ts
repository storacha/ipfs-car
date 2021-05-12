import fs from 'fs'
import { expect } from 'chai'
import { CID } from 'multiformats'

import { fromCarIterable, fromCarToDisk } from '../dist'

const rawCidString = 'bafkreigk2mcysiwgmacvilb3q6lcdaq53zlwu3jn4pj6qev2lylyfbqfdm'
const rawCid = CID.parse(rawCidString)

describe('fromCarIterable', () => {
  it('file system', async () => {
    const inStream = fs.createReadStream(`${__dirname}/fixtures/raw.car`)
    const files = []

    for await (const file of fromCarIterable(inStream)) {
      expect(file.path).to.eql(rawCidString)
      expect(rawCid.equals(file.cid)).to.eql(true)
      files.push(file)
    }

    expect(files).to.have.lengthOf(1)
  })
})

describe('fromCarToDisk', () => {
  it('file system', async () => {
    // TODO: This is a type raw, not file
    const inStream = fs.createReadStream(`${__dirname}/fixtures/raw.car`)
    
    await fromCarToDisk(inStream, __dirname)
    // TODO: Check if exists + Clean up File
  })
})
