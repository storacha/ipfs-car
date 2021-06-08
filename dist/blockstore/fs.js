"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FsBlockStore = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const multiformats_1 = require("multiformats");
class FsBlockStore {
    constructor() {
        this.path = `${os_1.default.tmpdir()}/${(parseInt(String(Math.random() * 1e9), 10)).toString() + Date.now()}`;
        this._opened = false;
    }
    async _open() {
        if (this._opening) {
            await this._opening;
        }
        else {
            this._opening = fs_1.default.promises.mkdir(this.path);
            await this._opening;
            this._opened = true;
        }
    }
    async put({ cid, bytes }) {
        if (!this._opened) {
            await this._open();
        }
        const cidStr = cid.toString();
        const location = `${this.path}/${cidStr}`;
        await fs_1.default.promises.writeFile(location, bytes);
        return { cid, bytes };
    }
    async get(cid) {
        if (!this._opened) {
            await this._open();
        }
        const cidStr = cid.toString();
        const location = `${this.path}/${cidStr}`;
        const bytes = await fs_1.default.promises.readFile(location);
        return { cid, bytes };
    }
    async *blocks() {
        if (!this._opened) {
            await this._open();
        }
        const cids = await fs_1.default.promises.readdir(this.path);
        for (const cidStr of cids) {
            const location = `${this.path}/${cidStr}`;
            const bytes = await fs_1.default.promises.readFile(location);
            yield { cid: multiformats_1.CID.parse(cidStr), bytes };
        }
    }
    async destroy() {
        await fs_1.default.promises.rm(this.path, { recursive: true });
    }
}
exports.FsBlockStore = FsBlockStore;
