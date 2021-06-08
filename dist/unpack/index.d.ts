import { CarIndexedReader, CarReader } from '@ipld/car';
import { CID } from 'multiformats';
import { UnixFSEntry } from 'ipfs-unixfs-exporter';
export declare function unpack(carReader: CarReader | CarIndexedReader, roots?: CID[]): AsyncIterable<UnixFSEntry>;
