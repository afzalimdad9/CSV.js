/* jshint esversion: 6 */

import * as fs from "fs";
import { promisify } from "util";
import path from "path";
const load = require("require-reload")(require);
let CSV: any;

const readFileAsync = promisify(fs.readFile);

// Bootstrap data
interface DataStore {
  csv: Record<string, string>;
  json: Record<string, any>;
}

const data: DataStore = {
  csv: {},
  json: {}
};
const getFilePath = (dataset: string, format: string): string => 
  path.join(__dirname, `./datasets/${format}/${dataset}.${format}`);

const loadFile = async (dataset: string, format: string): Promise<void> => {
  const filePath = getFilePath(dataset, format);
  try {
    const fileContent = await readFileAsync(filePath, "utf8");
    data[format][dataset] = format === "json" ? JSON.parse(fileContent) : fileContent;
  } catch (err) {
    console.error(`Error loading file ${filePath}:`, err);
  }
};
const loadData = async () => {
  const datasets = ["worldbank", "marriage_census", "malformed"];
  const formats = ["csv", "json"];
  await Promise.all(
    datasets.flatMap(dataset => formats.map(format => loadFile(dataset, format)))
  );
};

// Setup the export
const reload = (): any => load("./csv.src");
CSV = reload(); // Run it once

export { CSV, reload, data };
export default loadData;

