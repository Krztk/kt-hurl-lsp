import { CompletionParams } from "../src/types";
import { completion } from "../src/handlers/text-document/completion";
import { documents } from "../src/documents";
import { groupedEndpoints } from "../src/open-api-reader";

describe("completion tests", () => {
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
          ],
        },
        {
          method: "get",
          route: "/Article/Published",
          params: [],
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

  describe("completion items", () => {
    describe("when line does not start with an HTTP method", () => {
      it("filters attributes by partial word", async () => {
        const fileUri = "file:///test.hurl";
        const params: CompletionParams = {
          position: { character: 2, line: 0 },
          textDocument: { uri: fileUri },
        };

        const testContent = "[C";
        documents.set(fileUri, testContent);

        const result = completion({
          jsonrpc: "2.0",
          id: 1,
          method: "textDocument/completion",
          params,
        });

        expect(result).not.toBeNull();
        expect(result?.items[0]?.label).toBe("[Captures]");
        expect(result?.items[1]?.label).toBe("[Cookies]");
      });
      it("includes all attributes on empty line", async () => {
        const fileUri = "file:///test.hurl";
        const params: CompletionParams = {
          position: { character: 0, line: 0 },
          textDocument: { uri: fileUri },
        };

        const testContent = "";
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
          "[Asserts]",
          "[BasicAuth]",
          "[Query]",
          "[Cookies]",
          "[Options]",
          "[Multipart]",
        ]);
      });
      it("includes all attributes when cursor is on '['", async () => {
        const fileUri = "file:///test.hurl";
        const params: CompletionParams = {
          position: { character: 1, line: 0 },
          textDocument: { uri: fileUri },
        };

        const testContent = "[";
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
          "[Asserts]",
          "[BasicAuth]",
          "[Query]",
          "[Cookies]",
          "[Options]",
          "[Multipart]",
        ]);
      });
      it("includes all params and unused attributes for current endpoint", async () => {
        const fileUri = "file:///test.hurl";
        const params: CompletionParams = {
          position: { character: 0, line: 2 },
          textDocument: { uri: fileUri },
        };

        const testContent = "GET /Article/Draft\n[Query]\n";
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
          "userId:",
          "[Captures]",
          "[Form]",
          "[Asserts]",
          "[BasicAuth]",
          "[Cookies]",
          "[Options]",
          "[Multipart]",
        ]);
      });
    });

    describe("when line starts with an HTTP method", () => {
      it("suggests endpoints for the method", () => {
        const fileUri = "file:///test.hurl";
        const params: CompletionParams = {
          position: { character: 4, line: 0 },
          textDocument: { uri: fileUri },
        };

        const testContent = "GET ";
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
          "/Article/Draft",
          "/Article/Published",
          "/Article/Deleted",
          "/Article/{ArticleId}",
        ]);
      });
      it("filters endpoints by method and partial word", () => {
        const fileUri = "file:///test.hurl";

        const testContent = "GET /Article/D";

        const params: CompletionParams = {
          position: { character: testContent.length, line: 0 },
          textDocument: { uri: fileUri },
        };

        documents.set(fileUri, testContent);

        const result = completion({
          jsonrpc: "2.0",
          id: 1,
          method: "textDocument/completion",
          params,
        });

        expect(result).not.toBeNull();
        const labels = result!.items.map((item) => item.label);
        expect(labels).toEqual(["/Article/Draft", "/Article/Deleted"]);
      });
      it("filters endpoints by method and partial word - including path parameters", () => {
        const fileUri = "file:///test.hurl";

        const testContent = "GET /Article/{";

        const params: CompletionParams = {
          position: { character: testContent.length, line: 0 },
          textDocument: { uri: fileUri },
        };

        documents.set(fileUri, testContent);

        const result = completion({
          jsonrpc: "2.0",
          id: 1,
          method: "textDocument/completion",
          params,
        });

        expect(result).not.toBeNull();
        const labels = result!.items.map((item) => item.label);
        expect(labels).toEqual(["/Article/{ArticleId}"]);
      });
      it("include endpoints for method and envs", () => {
        const fileUri = "file:///test.hurl";

        const testContent = "GET {{API_URL}}/";

        const params: CompletionParams = {
          position: { character: testContent.length, line: 0 },
          textDocument: { uri: fileUri },
        };

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
          "/Article/Draft",
          "/Article/Published",
          "/Article/Deleted",
          "/Article/{ArticleId}",
        ]);
      });
    });
  });
});
