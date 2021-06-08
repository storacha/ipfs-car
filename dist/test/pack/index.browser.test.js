"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
// import { pack } from '../../dist/pack'
const pack_1 = require("ipfs-car/pack");
// import { packToBlob } from '../../dist/pack/blob'
const blob_1 = require("ipfs-car/pack/blob");
const memory_1 = require("../../dist/blockstore/memory");
describe('pack', () => {
    [memory_1.MemoryBlockStore].map((Blockstore) => {
        describe(`with ${Blockstore.name}`, () => {
            it('with iterable input', async () => {
                const { root, out } = await pack_1.pack({
                    input: [new Uint8Array([21, 31])],
                    blockstore: new Blockstore()
                });
                const carParts = [];
                for await (const part of out) {
                    carParts.push(part);
                }
                chai_1.expect(root.toString()).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y');
                chai_1.expect(carParts.length).to.eql(4);
            });
            it('returns a car blob', async () => {
                const { root, car } = await blob_1.packToBlob({
                    input: [new Uint8Array([21, 31])],
                    blockstore: new Blockstore()
                });
                chai_1.expect(root.toString()).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y');
            });
            it('pack does not destroy provided blockstore', async () => {
                const blockstore = new Blockstore();
                const spy = sinon_1.default.spy(blockstore, 'destroy');
                await pack_1.pack({
                    input: [new Uint8Array([21, 31])],
                    blockstore
                });
                chai_1.expect(spy.callCount).to.eql(0);
                await blockstore.destroy();
            });
            it('packToBlob does not destroy provided blockstore', async () => {
                const blockstore = new Blockstore();
                const spy = sinon_1.default.spy(blockstore, 'destroy');
                await blob_1.packToBlob({
                    input: [new Uint8Array([21, 31])],
                    blockstore
                });
                chai_1.expect(spy.callCount).to.eql(0);
                await blockstore.destroy();
            });
        });
    });
});
