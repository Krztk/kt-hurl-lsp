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

  const regex = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const method = lineUntilCursor.match(regex)?.[1]?.toLowerCase();

  let rawItems: string[] = [];
  if (method && supportedMethods.includes(method)) {
    rawItems = getCompletionForEndpoints(currentLine, lineUntilCursor, method);
  } else {
    rawItems = getCompletionForAttributes(currentLine, lineUntilCursor);
  }

  const items = rawItems.slice(0, MAX_ITEMS).map((x) => ({ label: x }));

  return {
    isIncomplete: rawItems.length > MAX_ITEMS,
    items,
  };
};

const getCompletionForAttributes = (
  curentLine: string,
  lineUntilCursor: string,
) => {
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

  const completionItems = ITEMS.filter((x) =>
    x.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()),
  );

  log.writeIndented({
    prefixFINAL: prefix,
    word,
    delimiter,
    whitespace,
    completionItems,
  });

  return completionItems;
};

const endpointRegex =
  /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b\s*([a-zA-Z/\-_]*)/;
const getCompletionForEndpoints = (
  curentLine: string,
  lineUntilCursor: string,
  method: string,
) => {
  const m = lineUntilCursor.match(endpointRegex);
  const partialEndpointCapture = m?.[2] ?? "";

  const partialEndpoint = partialEndpointCapture.startsWith("/")
    ? partialEndpointCapture
    : `/${partialEndpointCapture}`;

  return getEndpoints()
    .flatMap((endpoint) => endpoint[method as Method])
    .filter((endpoint) => endpoint.route.startsWith(partialEndpoint))
    .map((endpoint) => endpoint.route);
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
