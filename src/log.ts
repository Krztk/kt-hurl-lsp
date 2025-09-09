import * as fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

const logFile = process.env.LOG_FILE;
if (!logFile) {
  throw new Error("Missing required environment variable: LOG_FILE");
}

const logStream = fs.createWriteStream(logFile);

export const log = {
  write: (message: object | unknown) => {
    if (typeof message === "object") {
      logStream.write(JSON.stringify(message));
    } else {
      logStream.write(message);
    }
    logStream.write("\n");
  },
  writeIndented: (message: object) => {
    logStream.write(JSON.stringify(message, null, 2));
    logStream.write("\n");
  },
};
