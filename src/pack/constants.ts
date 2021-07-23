import { sha256 } from 'multiformats/hashes/sha2'
import type { UserImporterOptions } from 'ipfs-unixfs-importer/src/types'

export const unixfsImporterOptionsDefault = {
  cidVersion: 1,
  chunker: 'fixed',
  maxChunkSize: 262144,
  hasher: sha256,
  rawLeaves: true,
  wrapWithDirectory: true
} as UserImporterOptions
