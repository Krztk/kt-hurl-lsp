import { log } from "./log";

let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;

  while (true) {
    const lengthMatch = buffer.match(/Content-Length: (\d+)\r\n/);
    if (!lengthMatch || !lengthMatch[1]) break;

    const contentLength = parseInt(lengthMatch[1], 10);
    const messageStart = buffer.indexOf("\r\n\r\n") + 4;

    if (buffer.length < messageStart + contentLength) break;

    const rawMessage = buffer.slice(messageStart, messageStart + contentLength);
    const message = JSON.parse(rawMessage);

    log.write({ id: message.id, method: message.method });
    buffer = buffer.slice(messageStart + contentLength);
  }
});
