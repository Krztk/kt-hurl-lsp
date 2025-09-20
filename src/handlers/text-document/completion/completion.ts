import { documents } from "../../../documents";
import { supportedMethods } from "../../../open-api-reader";
import { CompletionParams, Range, RequestMessage } from "../../../types";
import {
  getCompletionsForAttributes,
  getCompletionsForEndpoint,
  getCompletionsForEndpoints,
  getEndpointContextForCurrentLine,
} from "./get-completions";

type InsertTextFormat = 1 | 2; //plain // snippet
type InsertTextMode = 1 | 2; //asIs //adjustIndentation

export interface CompletionList {
  isIncomplete: boolean;
  itemDefaults?: {
    commitCharacters?: string[];
    editRange?:
      | Range
      | {
          insert: Range;
          replace: Range;
        };
    insertTextFormat?: InsertTextFormat;
    insertTextMode?: InsertTextMode;
    data?: any;
  };
  items: CompletionItem[];
}

export interface CompletionItem {
  label: string;
  // labelDetails?: CompletionItemLabelDetails;
  // kind?: CompletionItemKind;
  // tags?: CompletionItemTag[];
  // detail?: string;
  // documentation?: string | MarkupContent;
  // deprecated?: boolean;
  // preselect?: boolean;
  // sortText?: string;
  // filterText?: string;
  // insertText?: string;
  // insertTextFormat?: InsertTextFormat;
  // insertTextMode?: InsertTextMode;
  // textEdit?: TextEdit | InsertReplaceEdit;
  // textEditText?: string;
  // additionalTextEdits?: TextEdit[];
  // commitCharacters?: string[];
  // command?: Command;
  // data?: any;
}

const MAX_ITEMS = 10;

export const completion = (message: RequestMessage): CompletionList | null => {
  const params = message.params as CompletionParams;
  const content = documents.get(params.textDocument.uri);

  if (content == undefined) return null;

  const lineNumber = params.position.line;
  const lines = content.split("\n");
  const currentLine = lines[lineNumber]!;
  const lineUntilCursor = currentLine.slice(0, params.position.character);

  const regex = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const method = lineUntilCursor.match(regex)?.[1]?.toLowerCase();

  let rawItems: string[] = [];
  if (method && supportedMethods.includes(method)) {
    rawItems = getCompletionsForEndpoints(lineUntilCursor, method);
  } else {
    const endpointContext = getEndpointContextForCurrentLine(lines, lineNumber);

    if (endpointContext) {
      rawItems = getCompletionsForEndpoint({
        lineUntilCursor,
        endpointContext,
      });
    } else {
      rawItems = getCompletionsForAttributes(lineUntilCursor);
    }
  }

  const items = rawItems.slice(0, MAX_ITEMS).map((x) => ({ label: x }));

  return {
    isIncomplete: rawItems.length > MAX_ITEMS,
    items,
  };
};
