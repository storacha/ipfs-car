"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = void 0;
const equals_1 = __importDefault(require("uint8arrays/equals"));
const sha2_1 = require("multiformats/hashes/sha2");
const ipfs_unixfs_exporter_1 = __importDefault(require("ipfs-unixfs-exporter"));
// Export unixfs entries from car file
async function* unpack(carReader, roots) {
    const verifyingBlockService = {
        get: async (cid) => {
            const res = await carReader.get(cid);
            if (!res) {
                throw new Error(`Incomplete CAR. Block missing for CID ${cid}`);
            }
            if (!isValid(res)) {
                throw new Error(`Invalid CAR. Hash of block data does not match CID ${cid}`);
            }
            return res;
        },
        put: ({ cid, bytes }) => {
            return Promise.reject(new Error('should not get blocks'));
        }
    };
    if (!roots || roots.length === 0) {
        roots = await carReader.getRoots();
    }
    for (const root of roots) {
        yield* ipfs_unixfs_exporter_1.default.recursive(root, verifyingBlockService, { /* options */});
    }
}
exports.unpack = unpack;
async function isValid({ cid, bytes }) {
    const hash = await sha2_1.sha256.digest(bytes);
    return equals_1.default(hash.digest, cid.multihash.digest);
}
