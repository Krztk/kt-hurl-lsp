import { RequestMessage } from "../types";

type ServerCapabilities = Record<string, unknown>;
type ServerInfo = {
  name: string;
  version?: string;
};

interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo: ServerInfo;
}

export const initialize = (message: RequestMessage): InitializeResult => {
  return {
    capabilities: {},
    serverInfo: {
      name: "kt-hurl-lsp",
      version: "0.0.1",
    },
  };
};
