import { initialize } from "./handlers/initialize";
import { completion } from "./handlers/text-document/completion";
import { didChange } from "./handlers/text-document/did-change";
import { log } from "./log";
import { Message, RequestMessage } from "./types";

export interface NotificationMessage extends Message {
  method: string;
  params?: unknown[] | object;
}

type NotificationMessageHandler = (message: NotificationMessage) => void;

type MessageHandler = (
  message: RequestMessage,
) => ReturnType<typeof initialize> | ReturnType<typeof completion>;

const handlers: Record<string, MessageHandler | NotificationMessageHandler> = {
  initialize,
  "textDocument/completion": completion,
  "textDocument/didChange": didChange,
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
    const message = JSON.parse(rawMessage) as RequestMessage;

    log.write({
      id: message.id,
      method: message.method,
    });

    const handler = handlers[message.method];

    if (handler) {
      const response = handler(message);
      if (response != undefined) {
        respond(message.id, response);
      }
    }

    buffer = buffer.slice(messageStart + contentLength);
  }
});
