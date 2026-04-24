import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const isVercelRuntime = Boolean(process.env.VERCEL);
const dataDirectory = isVercelRuntime
  ? path.join(os.tmpdir(), "orrico-data")
  : path.resolve("server", "data");
const dataFilePath = path.join(dataDirectory, "app-data.json");

const defaultData = {
  users: [],
  sessions: [],
  databaseConnections: [],
};

function ensureDataFile() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(defaultData, null, 2),
      "utf8",
    );
  }
}

export function readData() {
  ensureDataFile();
  const fileContents = fs.readFileSync(dataFilePath, "utf8");
  return JSON.parse(fileContents);
}

export function writeData(nextData) {
  ensureDataFile();
  fs.writeFileSync(
    dataFilePath,
    JSON.stringify(nextData, null, 2),
    "utf8",
  );
}
