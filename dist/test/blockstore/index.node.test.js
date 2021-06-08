"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const multiformats_1 = require("multiformats");
const equals_1 = __importDefault(require("uint8arrays/equals"));
const it_all_1 = __importDefault(require("it-all"));
const memory_1 = require("../../dist/blockstore/memory");
const fs_1 = require("../../dist/blockstore/fs");
describe('blockstore', () => {
    [memory_1.MemoryBlockStore, fs_1.FsBlockStore].map((Blockstore) => {
        describe(`with ${Blockstore.name}`, () => {
            let blockstore;
            const cid = multiformats_1.CID.parse('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y');
            const bytes = new Uint8Array([21, 31]);
            beforeEach(() => {
                blockstore = new Blockstore();
            });
            afterEach(() => blockstore.destroy());
            it('can put and get', async () => {
                await blockstore.put({ cid, bytes });
                const storedBlock = await blockstore.get(cid);
                chai_1.expect(cid.equals(storedBlock.cid)).eql(true);
                chai_1.expect(equals_1.default(bytes, storedBlock.bytes)).eql(true);
            });
            it('can iterate on stored blocks', async () => {
                await blockstore.put({ cid, bytes });
                const blocks = await it_all_1.default(blockstore.blocks());
                chai_1.expect(blocks.length).eql(1);
                chai_1.expect(cid.equals(blocks[0].cid)).eql(true);
                chai_1.expect(equals_1.default(bytes, blocks[0].bytes)).eql(true);
            });
        });
    });
});
