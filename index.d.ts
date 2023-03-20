import { Block, EncoderSettings } from '@ipld/unixfs'
import { UnknownLink } from 'multiformats'
import { BlobLike, FileLike } from './types.js'

export type { BlobLike, FileLike, EncoderSettings, Block }
export declare function createFileEncoderStream (file: BlobLike, setting?: EncoderSettings): ReadableStream<Block>
export declare function createDirectoryEncoderStream (files: FileLike[], settings?: EncoderSettings): ReadableStream<Block>
export declare class CAREncoderStream extends TransformStream {
  constructor (roots?: UnknownLink[])
  finalBlock: Block|null
}
