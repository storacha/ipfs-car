import {ImportResult} from "ipfs-unixfs-importer";

export async function *printUnixFsContent(root: AsyncGenerator<ImportResult, void, unknown>): AsyncGenerator<ImportResult, void, unknown> {
  for await (const entry of root) {
    // tslint:disable-next-line:no-console
    console.log(`${entry.cid.toString()} ${entry.path}`)
    yield entry
  }
}