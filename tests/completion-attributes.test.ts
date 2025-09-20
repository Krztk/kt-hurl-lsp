import { CompletionParams } from "../src/types";
import { completion } from "../src/handlers/text-document/completion/completion";
import { documents } from "../src/documents";
import { groupedEndpoints } from "../src/open-api-reader";
import { getEndpointContextForCurrentLine } from "../src/handlers/text-document/completion/get-completions";

describe("attributes and params tests", () => {
  beforeAll(() => {
    groupedEndpoints.set("/openapi.json", {
      get: [
        {
          method: "get",
          route: "/Article/Draft",
          params: [
            {
              description: "Optional. Filter by user id.",
              in: "query",
              name: "userId",
              schema: {
                description: "Optional. Filter by user id.",
                format: "uuid",
                nullable: true,
                type: "string",
              },
            },
            {
              description: "Optional. Date from",
              in: "query",
              name: "from",
              schema: {
                description: "Optional. Filter by 'from' date",
                format: "date",
                nullable: true,
                type: "string",
              },
            },
            {
              description: "Optional. Date to",
              in: "query",
              name: "to",
              schema: {
                description: "Optional. Filter by 'to' date",
                format: "date",
                nullable: true,
                type: "string",
              },
            },
          ],
        },
        {
          method: "get",
          route: "/Article/Published",
          params: [
            {
              description: "Optional. Filter by type",
              in: "query",
              name: "type",
              schema: {
                description: "Optional. Filter by user id.",
                enum: ["Promoted", "Normal"],
                type: "string",
              },
            },
          ],
        },
        {
          method: "get",
          route: "/Article/Deleted",
          params: [],
        },
        {
          method: "get",
          route: "/Article/{ArticleId}",
          params: [],
        },
      ],
      post: [],
      delete: [],
      patch: [],
      put: [],
    });
  });

  beforeEach(() => {
    documents.clear();
  });

  afterEach(() => {
    documents.clear();
  });
  describe("given endpoint that does not exist in openapi.json", () => {
    it("should return only unused attributes", () => {
      const fileUri = "file:///test.hurl";
      const params: CompletionParams = {
        position: { character: 0, line: 3 },
        textDocument: { uri: fileUri },
      };
      const testContent = `GET {{API}}/not-in-the-open-api/test
[Query]
from: 2025-09-20T15:25:00.000Z

userId: 1
[Asserts]
`;
      documents.set(fileUri, testContent);

      const result = completion({
        jsonrpc: "2.0",
        id: 1,
        method: "textDocument/completion",
        params,
      });

      expect(result).not.toBeNull();
      const labels = result!.items.map((item) => item.label);
      expect(labels).toEqual([
        "[Captures]",
        "[Form]",
        // "[Asserts]",
        "[BasicAuth]",
        // "[Query]",
        "[Cookies]",
        "[Options]",
        "[Multipart]",
      ]);
    });
  }),
    describe("given endpoint with multiple parameters", () => {
      describe("and the current line is empty", () => {
        it("should include every param and attribute that was not used", async () => {
          const fileUri = "file:///test.hurl";
          const params: CompletionParams = {
            position: { character: 0, line: 6 },
            textDocument: { uri: fileUri },
          };

          const testContent = `GET {{API}}/Article/Published
[Cookies]

GET {{API}}/Article/Draft
[Query]
from: 2025-09-20T15:25:00.000Z

userId: 1
[Asserts]
`;

          documents.set(fileUri, testContent);

          const result = completion({
            jsonrpc: "2.0",
            id: 1,
            method: "textDocument/completion",
            params,
          });

          expect(result).not.toBeNull();
          const labels = result!.items.map((item) => item.label);
          expect(labels).toEqual([
            "to:",
            "[Captures]",
            "[Form]",
            // "[Asserts]",
            "[BasicAuth]",
            // "[Query]",
            "[Cookies]",
            "[Options]",
            "[Multipart]",
          ]);
        });
      });
    });

  describe("given endpoint with multiple parameters and partial param name", () => {
    it("should include every param that starts with partial param name", async () => {
      const fileUri = "file:///test.hurl";
      const params: CompletionParams = {
        position: { character: 4, line: 4 },
        textDocument: { uri: fileUri },
      };

      const testContent = `GET {{API}}/Article/Published

GET {{API}}/Article/Draft
[Query]
user
[Asserts]
`;

      documents.set(fileUri, testContent);

      const result = completion({
        jsonrpc: "2.0",
        id: 1,
        method: "textDocument/completion",
        params,
      });

      expect(result).not.toBeNull();
      const labels = result!.items.map((item) => item.label);
      expect(labels).toEqual(["userId:"]);
    });
    it("should include every unused param", async () => {
      const fileUri = "file:///test.hurl";
      const params: CompletionParams = {
        position: { character: 0, line: 4 },
        textDocument: { uri: fileUri },
      };

      const testContent = `GET {{API}}/Article/Published

GET {{API}}/Article/Draft
[Query]

userId: 1
[Asserts]
`;

      documents.set(fileUri, testContent);

      const result = completion({
        jsonrpc: "2.0",
        id: 1,
        method: "textDocument/completion",
        params,
      });

      expect(result).not.toBeNull();
      const labels = result!.items.map((item) => item.label);
      expect(labels).toEqual([
        "from:",
        "to:",
        "[Captures]",
        "[Form]",
        // "[Asserts]",
        "[BasicAuth]",
        // "[Query]",
        "[Cookies]",
        "[Options]",
        "[Multipart]",
      ]);
    });
  });
});
