# Setup

Copy and edit example env file.

```
cp .env.example .env
npm install
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
