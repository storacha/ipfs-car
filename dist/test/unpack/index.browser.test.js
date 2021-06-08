"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const concat_1 = __importDefault(require("uint8arrays/concat"));
const it_all_1 = __importDefault(require("it-all"));
const car_1 = require("@ipld/car");
const pack_1 = require("../../dist/pack");
const unpack_1 = require("../../dist/unpack");
const memory_1 = require("../../dist/blockstore/memory");
describe('unpack', () => {
    [memory_1.MemoryBlockStore].map((Blockstore) => {
        describe(`with ${Blockstore.name}`, () => {
            it('with iterable input', async () => {
                const { out } = await pack_1.pack({
                    input: [new Uint8Array([21, 31])],
                    blockstore: new Blockstore()
                });
                let bytes = new Uint8Array([]);
                for await (const part of out) {
                    bytes = concat_1.default([bytes, new Uint8Array(part)]);
                }
                const carReader = await car_1.CarReader.fromBytes(bytes);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files.length).to.eql(1);
                chai_1.expect(files[0].type).to.eql('raw');
                chai_1.expect(files[0].name).to.eql('bafkreifidl2jnal7ycittjrnbki6jasdxwwvpf7fj733vnyhidtusxby4y');
            });
        });
    });
});
