/* eslint-env mocha */
import fs from 'fs'
import path from 'path'
import os from 'os'
import assert from 'assert'
import { execaSync } from 'execa'

const binPath = './bin.js'

describe('CLI', function () {
  this.timeout(5000)

  /** @type {string[]} */
  let tmpPaths = []
  const tmpPath = () => {
    const tmp = path.join(os.tmpdir(), `ipfs-car-test-${Date.now()}-${(Math.random() * 10).toFixed()}`)
    tmpPaths.push(tmp)
    return tmp
  }

  beforeEach(() => { tmpPaths = [] })

  afterEach(async () => {
    for (const p of tmpPaths) {
      try {
        const stats = await fs.promises.stat(p)
        if (stats.isDirectory()) await fs.promises.rmdir(p, { recursive: true })
        else await fs.promises.rm(p)
      } catch (err) {
        console.warn('failed to remove temp path after test:', p, err)
      }
    }
  })

  it('throws when no command', () => {
    assert.throws(() => execaSync('./bin.js'), /No command specified./)
  })

  it('pack and unpack file', async () => {
    const filePath = './test/fixtures/comic/pinpie.jpg'
    const packPath = tmpPath()
    const res = execaSync(binPath, ['pack', filePath, '--output', packPath])

    const root = res.stdout.trim()
    assert.equal(root, 'bafybeiajdopsmspomlrpaohtzo5sdnpknbolqjpde6huzrsejqmvijrcea')

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', packPath, '--output', unpackPath])

    assert.deepEqual(
      await fs.promises.readFile(path.join(unpackPath, 'pinpie.jpg')),
      await fs.promises.readFile(filePath)
    )
  })

  it('pack and unpack file (no wrap)', async () => {
    const filePath = './test/fixtures/comic/pinpie.jpg'
    const packPath = tmpPath()
    const res = execaSync(binPath, ['pack', filePath, '--no-wrap', '--output', packPath])

    const root = res.stdout.trim()
    assert.equal(root, 'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa')

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', packPath, '--output', unpackPath])

    assert.deepEqual(
      await fs.promises.readFile(unpackPath),
      await fs.promises.readFile(filePath)
    )
  })

  it('stdin | pack | unpack | stdout a file', async () => {
    const filePath = './test/fixtures/comic/pinpie.jpg'
    const res0 = execaSync(binPath, ['pack', '--no-wrap'], {
      inputFile: filePath,
      encoding: null
    })

    const root = res0.stderr.toString('utf-8').trim()
    assert.equal(root, 'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa')

    const packPath = tmpPath()
    await fs.promises.writeFile(packPath, res0.stdout)

    const res1 = execaSync(binPath, ['unpack'], {
      inputFile: packPath,
      encoding: null
    })

    const unpackPath = tmpPath()
    await fs.promises.writeFile(unpackPath, res1.stdout)

    assert.deepEqual(
      await fs.promises.readFile(unpackPath),
      await fs.promises.readFile(filePath)
    )
  })

  it('pack and unpack directory', async () => {
    const dirPath = './test/fixtures/comic'
    const packPath = tmpPath()
    const res = execaSync(binPath, ['pack', dirPath, '--output', packPath])

    const root = res.stdout.trim()
    assert.equal(root, 'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq')

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', packPath, '--output', unpackPath])

    const files = await fs.promises.readdir(dirPath)
    for (const file of files) {
      if (file === '.') continue
      assert.deepEqual(
        await fs.promises.readFile(path.join(unpackPath, file)),
        await fs.promises.readFile(path.join(dirPath, file))
      )
    }
  })

  it('pack and unpack hidden file in directory', async () => {
    const dirPath = './test/fixtures'
    const packPath = tmpPath()
    execaSync(binPath, ['pack', dirPath, '--hidden', '--output', packPath])

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', packPath, '--output', unpackPath])

    const files = await fs.promises.readdir(dirPath)
    assert(files.includes('.hidden'))
    assert.deepEqual(
      await fs.promises.readFile(path.join(unpackPath, '.hidden')),
      await fs.promises.readFile(path.join(dirPath, '.hidden'))
    )
  })

  it('pack non existent paths fails', () => {
    assert.throws(() => execaSync(binPath, ['pack', 'abchzz']), /does not exist/)
  })

  it('unpack directory to stdout fails', () => {
    const dirPath = './test/fixtures/comic'
    const packPath = tmpPath()
    const res = execaSync(binPath, ['pack', dirPath, '--output', packPath])

    const root = res.stdout.trim()
    assert.equal(root, 'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq')
    assert.throws(() => execaSync(binPath, ['unpack', packPath]), /Not a file/)
  })

  it('unpack with missing block fails', () => {
    const carPath = './test/fixtures/missing-root-block.car'
    assert.throws(() => execaSync(binPath, ['unpack', carPath]), /Missing block/)
  })

  it('unpack multi-root fails', () => {
    const carPath = './test/fixtures/multi-root.car'
    assert.throws(() => execaSync(binPath, ['unpack', carPath]), /Multiple roots found/)
  })

  it('unpack multi-root with --root option', async () => {
    const filePath = './test/fixtures/comic/pinpie.jpg'
    const carPath = './test/fixtures/multi-root.car'

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', carPath, '--root', 'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa', '--output', unpackPath])

    assert.deepEqual(
      await fs.promises.readFile(unpackPath),
      await fs.promises.readFile(filePath)
    )
  })

  it('list roots', () => {
    const carPath = './test/fixtures/pinpie.car'
    const res = execaSync(binPath, ['roots', carPath])
    assert(res.stdout.includes('bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa'))
  })

  it('list implicit roots', () => {
    const carPath = './test/fixtures/comic-no-roots.car'
    const res = execaSync(binPath, ['roots', carPath, '--implicit'])
    assert(res.stdout.includes('bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq'))
  })

  it('stdin | list implicit roots', () => {
    const carPath = './test/fixtures/pinpie.car'
    const res = execaSync(binPath, ['roots', '--implicit'], {
      inputFile: carPath
    })
    assert(res.stdout.includes('bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa'))
  })

  it('files list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['ls', carPath])
    assert.equal(res.stdout, ['.', './pinpie.jpg', './youareanonsense.jpg'].join('\n'))
  })

  it('files list verbose', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['ls', carPath, '--verbose'])
    assert.equal(res.stdout, [
      'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq\t-\t.',
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa\t47874\t./pinpie.jpg',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24\t36981\t./youareanonsense.jpg'
    ].join('\n'))
  })

  it('files list with missing block fails', () => {
    const carPath = './test/fixtures/missing-root-block.car'
    assert.throws(() => execaSync(binPath, ['ls', carPath]), /missing block/)
  })

  it('stdin | files list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['ls'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, ['.', './pinpie.jpg', './youareanonsense.jpg'].join('\n'))
  })

  it('blocks list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['blocks', carPath])
    assert.equal(res.stdout, [
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24',
      'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq'
    ].join('\n'))
  })

  it('stdin | blocks list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['blocks'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, [
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24',
      'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq'
    ].join('\n'))
  })

  it('generate CAR CID', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['hash', carPath])
    assert.equal(res.stdout, 'bagbaieraycsgjotn63wc2tdyiyadvkdach5vphpdmoeehnseebjbtapgi44q')
  })

  it('generate multihash', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['hash', carPath, '--only-multihash'])
    assert.equal(res.stdout, 'zQmbJeNsbY4jTphnsZ4RBHG2jC8STcBanGVPi3V3A9FQxSU')
  })

  it('stdin | generate CAR CID', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['hash'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, 'bagbaieraycsgjotn63wc2tdyiyadvkdach5vphpdmoeehnseebjbtapgi44q')
  })
})
