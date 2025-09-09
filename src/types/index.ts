export interface Message {
  jsonrpc: string;
}

export interface RequestMessage extends Message {
  id: number | string;
  method: string;
  params?: unknown[] | object;
}

export type DocumentUri = string;
export type DocumentBody = string;
interface TextDocumentIdentifier {
  uri: DocumentUri;
}

export interface VersionedTextDocumentIdentifier
  extends TextDocumentIdentifier {
  version: number;
}

export type TextDocumentContentChangeEvent =
  | {
      range: Range;
      rangeLength?: number;
      text: string;
    }
  | {
      text: string;
    };

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextDocumentPositionParams {
  textDocument: TextDocumentIdentifier;
  position: Position;
}

export interface CompletionParams extends TextDocumentPositionParams {
  context?: CompletionContext;
}

export type CompletionTriggerKind = 1 | 2 | 3; //invoked, trigger char, trigger for incomplete completions
interface CompletionContext {
  triggerKind: CompletionTriggerKind;
  triggerCharacter?: string;
}
