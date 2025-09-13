import { documents } from "../../documents";
import { log } from "../../log";
import { getEndpoints, Method, supportedMethods } from "../../open-api-reader";
import { CompletionParams, Range, RequestMessage } from "../../types";

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

  const currentLine = content.split("\n")[params.position.line]!;
  const lineUntilCursor = currentLine.slice(0, params.position.character);

  const m = lineUntilCursor.match(/([:\[])?(\s*)(\w+)$/);
  const delimiter = m?.[1] ?? ""; // ":" or "[" if present
  const whitespace = m?.[2] ?? ""; // any spaces after delimiter
  const word = m?.[3] ?? "";

  let prefix = "";
  if (delimiter === ":") {
    prefix = word;
  } else {
    prefix = whitespace === "" ? `${delimiter}${word}` : word;
  }

  const regex = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const method = lineUntilCursor.match(regex)?.[1]?.toLowerCase();

  let rawItems: string[] = [];
  if (method && supportedMethods.includes(method)) {
    rawItems = getEndpoints()
      .flatMap((endpoint) => endpoint[method as Method])
      .map((endpoint) => endpoint.route);
  } else {
    rawItems = ITEMS;
  }

  const items = rawItems
    .filter((x) => x.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()))
    .slice(0, MAX_ITEMS)
    .map((x) => ({ label: x }));

  log.writeIndented({
    prefixFINAL: prefix,
    word,
    delimiter,
    whitespace,
    items,
  });

  return {
    isIncomplete: rawItems.length > MAX_ITEMS,
    items,
  };
};

const ITEMS = [
  "[Captures]",
  "[Form]",
  "[Asserts]",
  "[BasicAuth]",
  "[Query]",
  "[Cookies]",
  "[Options]",
  "[Multipart]",
];
