declare module 'csv-parser-module' {
    export interface DecodeOptions {
      skip?: number;
      limit?: number | false;
      newline?: string;
      delimiter?: string;
      header?: boolean;
      cast?: boolean;
    }
  
    export interface EncodeOptions {
      delimiter?: string;
      newline?: string;
      header?: boolean;
    }
  
    export type CSVRow = string[] | Record<string, any>;
  
    export default class CSV {
      /**
       * Reads and parses the CSV input according to options provided.
       * @param input The CSV string input.
       * @param options Parsing options.
       */
      static read(input: string, options?: DecodeOptions): CSVRow[];
  
      /**
       * Parses tokenized CSV lines.
       * @param lines The array of CSV lines.
       * @param options Parsing options.
       */
      static parse(lines: string[], options?: DecodeOptions): CSVRow[];
  
      /**
       * Encodes an array of data into CSV format.
       * @param input The data to encode.
       * @param options Encoding options.
       */
      static write(input: CSVRow[], options?: EncodeOptions): string;
  
      /**
       * Tokenizes CSV input by delimiter.
       * @param input The input string.
       * @param delimiter The delimiter to use.
       * @param isLine If true, processes an individual line.
       */
      static tokenize(input: string, delimiter: string, isLine?: boolean): string[];
  
      /**
       * Creates constructors for row generation based on headers and casting.
       * @param lines The CSV lines.
       * @param options Parsing options.
       */
      static createConstructors(
        lines: string[],
        options: DecodeOptions
      ): { createRow: (row: string[]) => CSVRow };
  
      /**
       * Casts value to appropriate type (number, boolean, or string).
       * @param value The string value to cast.
       */
      static typeCast(value: string): string | number | boolean;
    }
  }
  