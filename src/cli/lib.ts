import fs from 'fs'
import { CarIndexedReader, CarCIDIterator } from '@ipld/car'
import { fromCar } from '../from-car'

export async function listFilesInCar ({input}: {input: string}) {
  const carReader = await CarIndexedReader.fromFile(input)
  for await (const file of fromCar(carReader)) {
    console.log(file.path)
  }
}

export async function listCidsInCar ({input}: {input: string}) {
  const carIterator = await CarCIDIterator.fromIterable(fs.createReadStream(input))
  for await (const cid of carIterator) {
    console.log(cid.toString())
  }
}

export async function listRootsInCar ({input}: {input: string}) {
  const carIterator = await CarCIDIterator.fromIterable(fs.createReadStream(input))
  const roots = await carIterator.getRoots()
  for (const root of roots) {
    console.log(root.toString())
  }
}