# OpenAPI File Handling

**kt-hurl-lsp** reads OpenAPI specifications to provide autocompletion and parameter suggestions for your Hurl files

## Setup Requirements

To enable OpenAPI integration, place your OpenAPI specification file in your project root:

```
your-project/
├── openapi.json          # Your OpenAPI spec
├── tests/
│   ├── api-test.hurl
│   └── user-test.hurl
└── other-files...
```

**Important**: The OpenAPI file must be named exactly `openapi.json` and located at the project root.

## How It Works

### Automatic Discovery

When you open any file in your project, the LSP server:

1. **Finds the project root** by looking for:

   - `.git` directory, or
   - `openapi.json` file

2. **Loads the OpenAPI spec** from `{project-root}/openapi.json` if it exists

3. **Parses and caches** the specification using Swagger Parser with full dereferencing

# Setup

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure envs** (optional)

   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

3. **Build the LSP server**
   ```bash
   npm run build
   ```

# Neovim configuration example

```
vim.filetype.add({
  extension = {
    hurl = "hurl",
  },
})
vim.lsp.config("kt-hurl-lsp", {
  cmd = { "node", "<path>/dist/server.js" },
  filetypes = { "hurl" },
  capabilities = vim.lsp.protocol.make_client_capabilities()
})
vim.lsp.enable("kt-hurl-lsp")
```
