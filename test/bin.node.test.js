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

    const root = res.stderr.trim()
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

    const root = res.stderr.trim()
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
    const dirPath = 'test/fixtures/comic'
    const packPath = tmpPath()
    const res = execaSync(binPath, ['pack', dirPath, '--output', packPath])

    const root = res.stderr.trim()
    assert.equal(root, 'bafybeiclikg6wjifrvhfxz72rqhda6x77wd2s2ewy3zcomtlp5f7zwvhby')

    const unpackPath = tmpPath()
    execaSync(binPath, ['unpack', packPath, '--output', unpackPath])

    const files = await fs.promises.readdir(dirPath, { withFileTypes: true, recursive: true })
    for (const file of files) {
      if (file.isDirectory()) continue
      // @ts-expect-error `path` is deprecated but `parentPath` is experimental
      const parentPath = file.parentPath ?? file.path
      assert.deepEqual(
        await fs.promises.readFile(path.join(unpackPath, parentPath.replace(dirPath, ''), file.name)),
        await fs.promises.readFile(path.join(parentPath, file.name))
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

    const root = res.stderr.trim()
    assert.equal(root, 'bafybeiclikg6wjifrvhfxz72rqhda6x77wd2s2ewy3zcomtlp5f7zwvhby')
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
    assert.equal(res.stdout, ['.', './nested', './nested/battleelephant.jpg', './pinpie.jpg', './youareanonsense.jpg'].join('\n'))
  })

  it('files list HAMT', () => {
    const carPath = './test/fixtures/comic-hamt.car'
    const res = execaSync(binPath, ['ls', carPath])
    assert.equal(res.stdout, ['.', './pinpie.jpg', './youareanonsense.jpg', './nested', './nested/battleelephant.jpg'].join('\n'))
  })

  it('files list multi block file', () => {
    const carPath = './test/fixtures/multi-block-file.car'
    const res = execaSync(binPath, ['ls', carPath])
    assert.equal(res.stdout, ['.', './mega-arms.gif'].join('\n'))
  })

  it('files list multi block file HAMT', () => {
    const carPath = './test/fixtures/multi-block-file-hamt.car'
    const res = execaSync(binPath, ['ls', carPath])
    assert.equal(res.stdout, ['.', './mega-arms.gif'].join('\n'))
  })

  it('files list verbose', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['ls', carPath, '--verbose'])
    assert.equal(res.stdout, [
      'bafybeiclikg6wjifrvhfxz72rqhda6x77wd2s2ewy3zcomtlp5f7zwvhby\t-\t.',
      'bafybeib5u6im5ntmpttzg3zyt7lzc5vnn74wtdullgr2p3isd44bs6d5ta\t-\t./nested',
      'bafkreidqychd3wyw4rixs2avqdkvlp6q7is4w3c6q2ef5h4hx77rkmm6xa\t54118\t./nested/battleelephant.jpg',
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa\t47874\t./pinpie.jpg',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24\t36981\t./youareanonsense.jpg'
    ].join('\n'))
  })

  it('files list with missing block prints "(missing)"', () => {
    const carPath = './test/fixtures/missing-root-block.car'
    const res = execaSync(binPath, ['ls', carPath])
    assert.equal(res.stdout, '.\t(missing)')
  })

  it('files list verbose with missing block prints "(missing)"', () => {
    const carPath = './test/fixtures/missing-root-block.car'
    const res = execaSync(binPath, ['ls', carPath, '--verbose'])
    assert.equal(res.stdout, 'bafybeibkzf4twp5vs4v7qkvgg5vytqg7l4a46agerv6bqfvoefrol2pdcq\t?\t.\t(missing)')
  })

  it('stdin | files list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['ls'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, ['.', './nested', './nested/battleelephant.jpg', './pinpie.jpg', './youareanonsense.jpg'].join('\n'))
  })

  it('blocks list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['blocks', carPath])
    assert.equal(res.stdout, [
      'bafkreidqychd3wyw4rixs2avqdkvlp6q7is4w3c6q2ef5h4hx77rkmm6xa',
      'bafybeib5u6im5ntmpttzg3zyt7lzc5vnn74wtdullgr2p3isd44bs6d5ta',
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24',
      'bafybeiclikg6wjifrvhfxz72rqhda6x77wd2s2ewy3zcomtlp5f7zwvhby'
    ].join('\n'))
  })

  it('stdin | blocks list', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['blocks'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, [
      'bafkreidqychd3wyw4rixs2avqdkvlp6q7is4w3c6q2ef5h4hx77rkmm6xa',
      'bafybeib5u6im5ntmpttzg3zyt7lzc5vnn74wtdullgr2p3isd44bs6d5ta',
      'bafkreiajkbmpugz75eg2tmocmp3e33sg5kuyq2amzngslahgn6ltmqxxfa',
      'bafkreibgj6uwfebncr524o5djgt5ibx2lru4gns3lsoy7fy5ds35zrvk24',
      'bafybeiclikg6wjifrvhfxz72rqhda6x77wd2s2ewy3zcomtlp5f7zwvhby'
    ].join('\n'))
  })

  it('generate CAR CID', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['hash', carPath])
    assert.equal(res.stdout, 'bagbaiera2xxdkwpmxd22m7yvjsl4jlk7envq54kcrukb4cmqnaj4v72ofeba')
  })

  it('stdin | generate CAR CID', () => {
    const carPath = './test/fixtures/comic.car'
    const res = execaSync(binPath, ['hash'], {
      inputFile: carPath
    })
    assert.equal(res.stdout, 'bagbaiera2xxdkwpmxd22m7yvjsl4jlk7envq54kcrukb4cmqnaj4v72ofeba')
  })
})
