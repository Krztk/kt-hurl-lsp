import { initialize } from "./handlers/initialize";
import { log } from "./log";
import { RequestMessage } from "./types";

type RequestHandler = (message: RequestMessage) => object;

const handlers: Record<string, RequestHandler> = {
  initialize,
};

const respond = (id: RequestMessage["id"], result: unknown) => {
  const message = JSON.stringify({ id, result });
  const messageLength = Buffer.byteLength(message, "utf-8");
  const header = `Content-Length: ${messageLength}\r\n\r\n`;

  log.write(header + message);
  process.stdout.write(header + message);
};

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

    const handler = handlers[message.method];

    if (handler) {
      respond(message.id, handler(message));
    }

    buffer = buffer.slice(messageStart + contentLength);
  }
});
