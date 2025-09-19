import path from "path";
import * as fs from "fs";
import { documents, workspace } from "../../documents";
import { log } from "../../log";
import { NotificationMessage } from "../../server";
import { DocumentUri } from "../../types";
import { processApiDocument } from "../../open-api-reader";

type TextDocumentItem = {
  uri: DocumentUri;
  languageId: string;
  version: number;
  text: string;
};

interface DidOpenTextDocumentParams {
  textDocument: TextDocumentItem;
}

export const didOpen = async (message: NotificationMessage) => {
  const params = message.params as DidOpenTextDocumentParams;
  const fsPath = uriToPath(params.textDocument.uri);

  if (workspace.root === null) {
    workspace.root = findProjectRoot(path.dirname(fsPath));
    log.write("[didOpen]: workspace set to: " + workspace.root);
  }

  const pathToOpenApi = `${workspace.root}/openapi.json`;
  if (fs.existsSync(pathToOpenApi)) {
    const api = await processApiDocument(pathToOpenApi);
  }

  documents.set(params.textDocument.uri, params.textDocument.text);
};

function uriToPath(uri: string): string {
  if (!uri.startsWith("file://")) {
    throw new Error(`Unsupported URI scheme: ${uri}`);
  }

  let path = decodeURIComponent(uri.replace("file://", ""));

  if (process.platform === "win32" && path[0] === "/") {
    path = path.slice(1);
  }

  return path;
}

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, ".git")) ||
      fs.existsSync(path.join(dir, "openapi.json"))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return startDir;
}
