import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPIV3 } from "openapi-types";
import { log } from "./log";

const apiCache = new Map<string, OpenAPIV3.Document>();

export async function processApiDocument(
  file: string,
): Promise<OpenAPIV3.Document> {
  if (apiCache.has(file)) {
    log.write(`[process api document](${file}): returning from cache`);
    return apiCache.get(file)!;
  }

  log.write(
    `[process api document](${file}): not in cache. Start processing openapi document`,
  );
  const api = (await SwaggerParser.dereference(file)) as OpenAPIV3.Document;
  apiCache.set(file, api);

  log.write(`[process api document](${file}): start processing endpoints`);
  processEndpoints(file, api);

  log.write(`[process api document](${file}): processing endpoints done`);

  return api;
}

export type Method = "get" | "post" | "put" | "delete" | "patch";
export interface Endpoint {
  method: Method;
  route: string;
  params: OpenAPIV3.ParameterObject[];
}

type GroupedEndpoints = Record<Method, Endpoint[]>;

export const groupedEndpoints = new Map<string, GroupedEndpoints>();

export const getEndpointsForUri = (uri: string) => groupedEndpoints.get(uri);
export const getEndpoints = (): GroupedEndpoints[] => {
  return Array.from(groupedEndpoints.values());
};

export const supportedMethods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
] satisfies Method[] as string[];

const processEndpoints = (file: string, api: OpenAPIV3.Document) => {
  const endpoints: GroupedEndpoints = {
    get: [],
    put: [],
    post: [],
    patch: [],
    delete: [],
  };

  for (const [route, methods] of Object.entries(api.paths)) {
    for (const [method, operation] of Object.entries(methods || {})) {
      if (!supportedMethods.includes(method)) continue;
      const params = (operation as OpenAPIV3.OperationObject).parameters || [];
      endpoints[method as Method].push({
        method: method as Method,
        route: route,
        params: params as OpenAPIV3.ParameterObject[],
      });
    }
  }

  groupedEndpoints.set(file, endpoints);
};
