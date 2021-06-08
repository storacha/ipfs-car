"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryBlockStore = void 0;
const multiformats_1 = require("multiformats");
class MemoryBlockStore {
    constructor() {
        this.store = new Map();
    }
    async *blocks() {
        for (const [cidStr, bytes] of this.store.entries()) {
            yield { cid: multiformats_1.CID.parse(cidStr), bytes };
        }
    }
    put({ cid, bytes }) {
        this.store.set(cid.toString(), bytes);
        return Promise.resolve({ cid, bytes });
    }
    get(cid) {
        const bytes = this.store.get(cid.toString());
        if (!bytes) {
            return Promise.reject(new Error(`No blocks for the given CID: ${cid.toString()}`));
        }
        return Promise.resolve({
            bytes,
            cid
        });
    }
    destroy() {
        this.store.clear();
        return Promise.resolve();
    }
}
exports.MemoryBlockStore = MemoryBlockStore;
