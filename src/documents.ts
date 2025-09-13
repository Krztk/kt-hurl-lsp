import { DocumentBody, DocumentUri } from "./types";

export const documents = new Map<DocumentUri, DocumentBody>();

export const workspace: {
  root: string | null;
} = {
  root: null,
};
