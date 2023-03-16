/* eslint-env browser */
import varint from 'varint'
import { encode as cborEncode } from '@ipld/dag-cbor'

/**
 * @param {import('multiformats').UnknownLink[]} roots
 * @returns {Uint8Array}
 */
function encodeHeader (roots) {
  const headerBytes = cborEncode({ version: 1, roots })
  const varintBytes = varint.encode(headerBytes.length)
  const header = new Uint8Array(varintBytes.length + headerBytes.length)
  header.set(varintBytes, 0)
  header.set(headerBytes, varintBytes.length)
  return header
}

/**
 * @param {import('@ipld/unixfs').Block} block
 * @returns {Uint8Array}
 */
function encodeBlock (block) {
  const varintBytes = varint.encode(block.cid.bytes.length + block.bytes.length)
  const bytes = new Uint8Array(varintBytes.length + block.cid.bytes.length + block.bytes.length)
  bytes.set(varintBytes)
  bytes.set(block.cid.bytes, varintBytes.length)
  bytes.set(block.bytes, varintBytes.length + block.cid.bytes.length)
  return bytes
}

/**
 * @extends {TransformStream<import('@ipld/unixfs').Block, Uint8Array>}
 */
export class CAREncoderStream extends TransformStream {
  /** @param {import('multiformats').UnknownLink[]} roots */
  constructor (roots = []) {
    super({
      start: (controller) => controller.enqueue(encodeHeader(roots)),
      transform: (block, controller) => {
        controller.enqueue(encodeBlock(block))
        this.finalBlock = block
      }
    })
    /** @type {import('@ipld/unixfs').Block?} */
    this.finalBlock = null
  }
}
