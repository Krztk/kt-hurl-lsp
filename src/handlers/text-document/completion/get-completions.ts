import { OpenAPIV3 } from "openapi-types";
import { Endpoint, getEndpoints, Method } from "../../../open-api-reader";

export const getCompletionsForEndpoints = (
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

export const getCompletionsForEndpoint = (
  endpoint: Endpoint,
  lineUntilCursor: string,
  usedAttributes: string[],
) => {
  const m = lineUntilCursor.match(/^\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_]*)$/);
  const paramMatch = m?.[1];
  const partialValue = m?.[2];

  if (paramMatch) {
    const param = endpoint.params.find((p) => p.name === paramMatch);
    if (param && param.schema) {
      const schema = param.schema as OpenAPIV3.SchemaObject;

      if (schema.type === "string" && schema.enum) {
        const enumValues = schema.enum.map((e) => String(e));
        return partialValue
          ? enumValues.filter((e) => e.startsWith(partialValue))
          : enumValues;
      }
    }
  }

  const completionAttributes = getCompletionsForAttributes(
    lineUntilCursor,
  ).filter((a) => !usedAttributes.includes(a));

  return endpoint.params
    .map((param) => `${param.name}:`)
    .concat(completionAttributes);
};

const endpointRegex =
  /^(GET|POST|PUT|PATCH|DELETE)\b\s*({{\w+}})*([a-zA-Z0-9/\-_{}]*)/;

export const getEndpointContextForCurrentLine = (
  lines: string[],
  lineNumber: number,
) => {
  let endpoint: Endpoint | undefined = undefined;
  let usedAttributes: string[] = [];
  for (let i = lineNumber - 1; i >= 0; i--) {
    const m = lines[i]?.match(endpointRegex);
    const method = m?.[1]?.toLowerCase();
    const partialEndpointCapture = m?.[3];

    if (partialEndpointCapture && method) {
      endpoint = getEndpoints()
        .flatMap((endpoint) => endpoint[method as Method])
        .find((endpoint) => endpoint.route === partialEndpointCapture);

      break;
    }

    const attributeMatch = lines[i]!.match(/[\[[a-zA-Z]+\]/);
    if (attributeMatch?.[0]) {
      usedAttributes.push(attributeMatch[0]);
    }
  }

  return {
    endpoint,
    usedAttributes,
  };
};

export const getCompletionsForAttributes = (lineUntilCursor: string) => {
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

  const completionItems = ATTRIBUTES.filter((attr) =>
    attr.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase()),
  );

  return completionItems;
};

const ATTRIBUTES = [
  "[Captures]",
  "[Form]",
  "[Asserts]",
  "[BasicAuth]",
  "[Query]",
  "[Cookies]",
  "[Options]",
  "[Multipart]",
];
