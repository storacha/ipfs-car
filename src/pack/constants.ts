import { sha256 } from 'multiformats/hashes/sha2'
import type { UserImporterOptions } from 'ipfs-unixfs-importer/types/src/types'

export const unixfsImporterOptionsDefault = {
  cidVersion: 1,
  chunker: 'fixed',
  maxChunkSize: 262144,
  hasher: sha256,
  rawLeaves: true,
  wrapWithDirectory: false,
  maxChildrenPerNode: 174
} as UserImporterOptions
