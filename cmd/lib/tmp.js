import fs from 'fs'
import path from 'path'
import os from 'os'

const tmpPaths = []

export function tmpPath () {
  const tmp = path.join(os.tmpdir(), `ipfs-car-${Date.now()}-${(Math.random() * 10).toFixed()}`)
  tmpPaths.push(tmp)
  return tmp
}

process.on('exit', () => tmpPaths.forEach(p => fs.rmSync(p)))
