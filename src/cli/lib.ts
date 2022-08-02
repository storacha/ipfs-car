import fs from 'fs'
import { CarIndexedReader, CarCIDIterator } from '@ipld/car'
import { unpack } from '../unpack'

export async function listFilesInCar ({input}: {input: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  for await (const file of unpack(carReader)) {
    // tslint:disable-next-line: no-console
    console.log(file.path)
  }
}

export async function listCidsInCar ({input}: {input: string}) {
  const carIterator = await CarCIDIterator.fromIterable(fs.createReadStream(input))
  for await (const cid of carIterator) {
    // tslint:disable-next-line: no-console
    console.log(cid.toString())
  }
}

export async function listRootsInCar ({input}: {input: string}) {
  const carIterator = await CarCIDIterator.fromIterable(fs.createReadStream(input))
  const roots = await carIterator.getRoots()
  for (const root of roots) {
    // tslint:disable-next-line: no-console
    console.log(root.toString())
  }
}

export async function listFilesAndCidsInCar({input}: {input: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  for await (const file of unpack(carReader)) {
    // tslint:disable-next-line: no-console
    console.log(`${file.cid.toString()} ${file.path}`)
  }
}