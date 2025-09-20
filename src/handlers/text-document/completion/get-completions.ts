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

type EndpointContext = {
  endpoint?: Endpoint;
  usedAttributes: string[];
  usedParams: string[];
};

export const getCompletionsForEndpoint = ({
  endpointContext: { endpoint, usedAttributes, usedParams },
  lineUntilCursor,
}: {
  endpointContext: EndpointContext;
  lineUntilCursor: string;
}): string[] => {
  const m = lineUntilCursor.match(/^\s*([a-zA-Z0-9_]+)(:\s*([a-zA-Z0-9_]*))?$/);
  const paramName = m?.[1];
  const isVariableNameFinal = Boolean(m?.[2]);
  const partialValue = m?.[3];

  if (endpoint && isVariableNameFinal && paramName) {
    const param = endpoint.params.find((p) => p.name === paramName);

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

  const partialName = paramName ?? "";
  const params = endpoint
    ? endpoint.params.filter(
        (p) => p.name.startsWith(partialName) && !usedParams.includes(p.name),
      )
    : [];

  const completionAttributes = getCompletionsForAttributes(
    lineUntilCursor,
  ).filter((a) => !usedAttributes.includes(a));

  return params
    .filter((param) => !usedParams.includes(param.name))
    .map((param) => `${param.name}:`)
    .concat(completionAttributes);
};

const endpointRegex =
  /^(GET|POST|PUT|PATCH|DELETE)\b\s*({{\w+}})*([a-zA-Z0-9/\-_{}]*)/;

export const getEndpointContextForCurrentLine = (
  lines: string[],
  lineNumber: number,
): EndpointContext => {
  let endpoint: Endpoint | undefined = undefined;
  let usedAttributes: string[] = [];
  let usedParams: string[] = [];

  const appendUsedAttributesAndParams = (line: string) => {
    const attributeRegex = /[\[[a-zA-Z]+\]/;
    const paramRegex = /^\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_\-:\.]*)$/;
    const attributeMatch = line.match(attributeRegex);
    if (attributeMatch?.[0]) {
      usedAttributes.push(attributeMatch[0]);
    }

    const paramMatch = line.match(paramRegex);
    const paramName = paramMatch?.[1];
    if (paramName) {
      usedParams.push(paramName);
    }
  };

  for (let i = lineNumber - 1; i >= 0; i--) {
    const line = lines[i] as string;
    const endpointMatch = line.match(endpointRegex);
    const method = endpointMatch?.[1]?.toLowerCase();
    const partialEndpointCapture = endpointMatch?.[3];
    if (partialEndpointCapture && method) {
      endpoint = getEndpoints()
        .flatMap((endpoint) => endpoint[method as Method])
        .find((endpoint) => endpoint.route === partialEndpointCapture);

      break;
    }

    appendUsedAttributesAndParams(line);
  }

  for (let i = lineNumber + 1; i < lines.length; i++) {
    const line = lines[i] as string;
    const isEmpty = line.trim() === "";

    if (isEmpty || endpointRegex.test(line)) break;
    appendUsedAttributesAndParams(line);
  }

  return {
    endpoint,
    usedAttributes,
    usedParams,
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
