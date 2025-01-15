import * as fs from 'fs';
import * as assert from 'assert';
import { CSV } from './csv';

interface ParsedData {
  csv: string;
  json: any;
}

const sets: string[] = ["marriage_census", "worldbank"];
const data: Record<string, ParsedData> = {
  marriage_census: { csv: '', json: '' },
  worldbank: { csv: '', json: '' },
};

sets.forEach(set => {
  data[set].csv = fs.readFileSync(`./datasets/csv/${set}.csv`, 'utf8');
  data[set].json = JSON.parse(fs.readFileSync(`./datasets/json/${set}.json`, 'utf8'));
});

describe("CSV", function () {
  
  describe("#parse()", function () {
    it("should return nothing if no data", function () {
      assert.strictEqual(CSV.parse(""), false);
    });

    it("should parse edge cases", function () {
      const expected = [
        [["1", "2", "3,4"]],
        [["1", "2", "\"3,4\""]],
        [["1", "2", "3\n4"]]
      ];
      const actual = ['1,2,"3,4"', '1,2,"""3,4"""', '1,2,"3\n4"'];

      expected.forEach((expect, index) => {
        assert.deepStrictEqual(CSV.parse(actual[index]), expect);
      });
    });

    it("should parse with no headers", function () {
      const expected = [["1", "2", "3", "4"], ["5", "6", "7", "8"]];
      const actual = '1,2,3,4\r\n5,6,7,8\r\n';
      assert.deepStrictEqual(CSV.parse(actual), expected);
    });

    it("should parse with headers", function () {
      const expected = [{ name: "Will", age: "32" }];
      const actual = "name,age\r\nWill,32\r\n";
      assert.deepStrictEqual(CSV.parse(actual, { header: true }), expected);
    });

    it("should parse files", function () {
      sets.forEach(set => {
        assert.deepStrictEqual(CSV.parse(data[set].csv, { header: true }), data[set].json);
      });
    });
  });

  // describe("#encode()", function() {
  //   it("should return an empty string if no data", function() {
  //     var expected = "",
  //         actual = [];
  //     assert.deepEqual(expected, new CSV(actual).encode());
  //   });
  //   it("should encode edge cases", function() {
  //     var expected = [
  //           '1,2,"3,4"',
  //           '1,2,"""3,4"""',
  //           '1,2,"3\n4"',
  //           '1,2,"3\n4"',
  //           '1,2,"3\n4"'
  //         ],
  //         actual = [
  //           [[1, 2, "3,4"]],
  //           [[1, 2, "\"3,4\""]],
  //           [[1, 2, "3\n4"]],
  //           [[1, 2, "3\n4"]],
  //           [[1, 2, "3\n4"]]
  //         ];

  //     expected.map(function(result, index) {
  //       assert.deepEqual(result, new CSV(actual[index], { line: "\n" }).encode());
  //     });
  //   });
  //   it("should encode with no headers", function() {
  //     var expected = '1,2,3,4\r\n5,6,7,8',
  //         actual = [[1, 2, 3, 4], [5, 6, 7, 8]];
  //     assert.deepEqual(expected, new CSV(actual).encode());
  //   });
  //   it("should encode with headers", function() {
  //     var expected = "\"name\",\"age\"\r\n\"Will\",32",
  //         actual = [{ name: "Will", age: 32 }];
  //     assert.deepEqual(expected, new CSV(actual, { header: true }).encode());
  //   });
  //   it("should encode files", function() {
  //     var options = { header: true, lineDelimiter: "\n" };
  //     sets.forEach(function(set) {
  //       assert.deepEqual(data[set].csv, new CSV(data[set].json, options).encode());
  //     });
  //   });
  //   it("should encode with cast", function() {
  //     var options = { cast: ["String", "Primitive"] },
  //         expected = "\"123\",\r\n\"null\",456",
  //         actual = [["123", null], [null, "456"]];
  //     assert.deepEqual(expected, new CSV(actual, options).encode());
  //   });
  //   it("should encode with custom cast", function() {
  //     var customFunc = function(val) { return val === null ? '' : this.string(val); },
  //         options = { cast: [customFunc, customFunc] },
  //         expected = "\"123\",\r\n,\"456\"",
  //         actual = [["123", null], [null, "456"]];
  //     assert.deepEqual(expected, new CSV(actual, options).encode());
  //   });
  // })
  ;
});
