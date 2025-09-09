import { documents } from "../../documents";
import { NotificationMessage } from "../../server";
import {
  TextDocumentContentChangeEvent,
  VersionedTextDocumentIdentifier,
} from "../../types";

interface DidChangeTextDocumentParams {
  textDocument: VersionedTextDocumentIdentifier;
  contentChanges: TextDocumentContentChangeEvent[];
}

export const didChange = (message: NotificationMessage) => {
  const params = message.params as DidChangeTextDocumentParams;

  documents.set(params.textDocument.uri, params.contentChanges[0]!.text);
};
