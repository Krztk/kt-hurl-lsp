import { documents } from "../../documents";
import { log } from "../../log";
import {
  Endpoint,
  getEndpoints,
  Method,
  supportedMethods,
} from "../../open-api-reader";
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

  const lineNumber = params.position.line;
  const lines = content.split("\n");
  const currentLine = lines[lineNumber]!;
  const lineUntilCursor = currentLine.slice(0, params.position.character);

  const regex = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const method = lineUntilCursor.match(regex)?.[1]?.toLowerCase();

  let rawItems: string[] = [];
  if (method && supportedMethods.includes(method)) {
    rawItems = getCompletionForEndpoints(currentLine, lineUntilCursor, method);
  } else {
    let endpoint: Endpoint | undefined = undefined;
    let attribute: string | undefined;
    for (let i = lineNumber - 1; i >= 0; i--) {
      const m = lines[i]?.match(endpointRegex);
      const method = m?.[1]?.toLowerCase();
      const partialEndpointCapture = m?.[3];

      // log.writeIndented({
      //   lines,
      //   currentLineIdx: i,
      //   currentLine: lines[i],
      //   method,
      //   partialEndpointCapture,
      //   attribute,
      // });
      // log.write("---");
      if (partialEndpointCapture && method) {
        endpoint = getEndpoints()
          .flatMap((endpoint) => endpoint[method as Method])
          .find((endpoint) => endpoint.route === partialEndpointCapture);

        // prepare items that can be used based on endpoint

        break;
      }

      const attributeMatch = lines[i]!.match(/[\[[a-zA-Z]+\]/);
      if (attributeMatch?.[0]) {
        attribute = attributeMatch[0];
      }
    }
    log.writeIndented({
      endpoint,
      currentLine,
      attribute,
    });

    if (endpoint) {
      const attributes = getCompletionForAttributes(
        currentLine,
        lineUntilCursor,
      ).filter((a) => a !== attribute);
      rawItems = endpoint.params
        .map((param) => `${param.name}:`)
        .concat(attributes);
    } else {
      rawItems = getCompletionForAttributes(currentLine, lineUntilCursor);
    }
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
  /^(GET|POST|PUT|PATCH|DELETE)\b\s*({{\w+}})*([a-zA-Z/\-_{}]*)/;
const getCompletionForEndpoints = (
  curentLine: string,
  lineUntilCursor: string,
  method: string,
) => {
  const m = lineUntilCursor.match(endpointRegex);
  const partialEndpointCapture = m?.[3] ?? "";

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
