import * as fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });
const isTest = process.env.NODE_ENV === "test";
const logFile = process.env.LOG_FILE;
const shouldLog = !isTest && logFile;

const logStream = shouldLog
  ? fs.createWriteStream(logFile)
  : { write: () => {} };

export const log = {
  write: (message: object | unknown) => {
    if (isTest) return;
    if (typeof message === "object") {
      logStream.write(JSON.stringify(message));
    } else {
      logStream.write(message);
    }
    logStream.write("\n");
  },
  writeIndented: (message: object) => {
    if (isTest) return;
    logStream.write(JSON.stringify(message, null, 2));
    logStream.write("\n");
  },
};
