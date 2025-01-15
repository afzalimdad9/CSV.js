/* jshint esversion: 6 */

(function (root: any, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CSV = factory();
  }
}(this, function () {
  'use strict';

  /* =========================================
   * Constants ===============================
   * ========================================= */
  var CELL_DELIMITERS = [",", ";", "\t", "|", "^"];
  var LINE_DELIMITERS = ["\r\n", "\r", "\n"];

  var STANDARD_DECODE_OPTS = {
    skip: 0,
    limit: false,
    header: false,
    cast: false
  };

  var STANDARD_ENCODE_OPTS = {
    delimiter: CELL_DELIMITERS[0],
    newline: LINE_DELIMITERS[0],
    skip: 0,
    limit: false,
    header: false
  };

  var quoteMark = '"';
  var doubleQuoteMark = '""';
  var quoteRegex = /"/g;
  var doubleQuoteRegex = /""/g;

  /* =========================================
   * Utility Functions =======================
   * ========================================= */
  function assign() {
    var args = Array.prototype.slice.call(arguments);
    var base = args[0];
    var rest = args.slice(1);
    for (var i = 0, len = rest.length; i < len; i++) {
      for (var attr in rest[i]) {
        base[attr] = rest[i][attr];
      }
    }
    return base;
  }

  function map(collection, fn) {
    var results: any[] = [];
    for (var i = 0, len = collection.length; i < len; i++) {
      results[i] = fn(collection[i], i);
    }
    return results;
  }

  var getType = function (obj) { return Object.prototype.toString.call(obj).slice(8, -1); };

  var getLimit = function (limit, len) { return limit === false ? len : limit; };

  var getter = function (index) { return ("d[" + index + "]"); };

  var getterCast = function (value, index) {
    if (!isNaN(Number(value))) {
      return ("Number(" + (getter(index)) + ")");
    } else if (value == "false" || value == "true" || value == "t" || value == "f") {
      return ((getter(index)) + " === \"true\" || " + (getter(index)) + " === \"t\"");
    } else {
      return getter(index);
    }
  };

  function buildObjectConstructor(fields, sample, cast) {
    var body = ["let object = new Object()"];
    var setter = function (attr) { return ("object[" + (JSON.stringify(attr)) + "] = "); };
    if (cast === true) {
      body = body.concat(map(fields, function (attr, idx) { return setter(attr) + getterCast(sample[idx], idx); }));
    } else {
      body = body.concat(map(fields, function (attr, idx) { return setter(attr) + getter(idx); }));
    }
    body.push("return object;");
    return new Function("d", body.join(";\n"));
  }

  function buildArrayConstructor(sample, cast) {
    var body = ["let row = new Array(" + sample.length + ")"];
    var setter = function (idx) { return ("row[" + idx + "] = "); };
    if (cast === true) {
      body = body.concat(map(sample, function (val, idx) { return setter(idx) + getterCast(val, idx); }));
    } else {
      body = body.concat(map(sample, function (_, idx) { return setter(idx) + getter(idx); }));
    }
    body.push("return row;");
    return new Function("d", body.join(";\n"));
  }

  function frequency(coll, needle, limit) {
    if (limit === void 0) limit = false;

    var count = 0;
    var lastIndex = 0;
    var maxIndex = getLimit(limit, coll.length);

    while (lastIndex < maxIndex) {
      lastIndex = coll.indexOf(needle, lastIndex);
      if (lastIndex === -1) break;
      count++;
    }

    return count;
  }

  function mostFrequent(coll, needles, limit) {
    var max = 0;
    var detected;

    for (var cur = needles.length - 1; cur >= 0; cur--) {
      if (frequency(coll, needles[cur], limit) > max) {
        detected = needles[cur];
      }
    }

    return detected || needles[0];
  }

  function unsafeParse(text, opts, fn) {
    var lines = text.split(opts.newline);

    if (opts.skip > 0) {
      lines.splice(opts.skip);
    }

    var fields;
    var constructor;

    function cells(line) {
      return line.split(opts.delimiter);
    }

    if (opts.header) {
      if (opts.header === true) {
        fields = cells(lines.shift());
      } else if (getType(opts.header) === "Array") {
        fields = opts.header;
      }

      constructor = buildObjectConstructor(fields, cells(lines[0]), opts.cast);
    } else {
      constructor = buildArrayConstructor(cells(lines[0]), opts.cast);
    }

    for (var cur = 0, lim = getLimit(opts.limit, lines.length); cur < lim; cur++) {
      var row = cells(lines[cur]);
      if (row.length > 1) {
        fn(constructor(row));
      }
    }

    return true;
  }

  var iota = (function () {
    var n = 0;
    return function () { return n++; };
  })();

  function safeParse(text, opts, fn) {
    var newline = opts.newline;

    var skip = opts.skip;

    var EOL = iota();
    var EOF = iota();
    var cur = 0;
    var len = text.length;

    var eolNext;

    function nextToken() {
      if (cur >= len) {
        return EOF;
      }
      if (eolNext) {
        eolNext = false;
        return EOL;
      }
      var mark = cur;
      var n;
      if (text[cur] === quoteMark) {
        while (cur++ < len) {
          if (text[cur] === quoteMark) {
            if (text[cur + 1] !== quoteMark) {
              break;
            }
            cur += 1;
          }
        }
        cur += 2;
        n = text[cur + 1];
        if (n === newline[0]) {
          if (newline.length > 1 && text[cur + 2] === newline[1]) cur++;
        }

        return text.slice(mark + 1, cur).replace(doubleQuoteRegex, quoteMark);
      }

      while (cur < len) {
        var delta = 1;
        n = text[cur++];
        if (n === newline[0]) {
          if (text[cur] === newline[1]) {
            cur++;
            delta++;
          }
        }
        return text.slice(mark, cur - delta);
      }

      return text.slice(mark);
    }

    var row;
    for (var token = nextToken(); token !== EOF; token = nextToken()) {
      if (skip-- > 0) {
        while (token !== EOL && token !== EOF) {
          token = nextToken();
        }
      }

      row = [];
      while (token !== EOL && token !== EOF) {
        row.push(token);
        token = nextToken();
      }
      fn(row);
    }

    return true;
  }

  function encodeCells(line, delimiter, newline) {
    var row = line.slice(0);
    for (var i = 0, len = row.length; i < len; i++) {
      if (typeof row[i] !== "string") {
        continue;
      }
      if (row[i].indexOf(quoteMark) !== -1) {
        row[i] = row[i].replace(quoteRegex, doubleQuoteMark);
      }
      if (row[i].indexOf(delimiter) !== -1 || row[i].indexOf(newline) !== -1) {
        row[i] = quoteMark + row[i] + quoteMark;
      }
    }
    return row.join(delimiter);
  }

  function encodeArrays(coll, opts, fn) {
    var delimiter = opts.delimiter;
    var newline = opts.newline;

    if (opts.header && getType(opts.header) === "Array") {
      fn(encodeCells(opts.header, delimiter, newline));
    }

    for (var cur = 0, lim = getLimit(opts.limit, coll.length); cur < lim; cur++) {
      fn(encodeCells(coll[cur], delimiter, newline));
    }

    return true;
  }

  function encodeObjects(coll, opts, fn) {
    var delimiter = opts.delimiter;
    var newline = opts.newline;
    var header;
    var row;

    header = [];
    row = [];
    for (var key in coll[0]) {
      header.push(key);
      row.push(coll[0][key]);
    }

    if (opts.header === true) {
      fn(encodeCells(header, delimiter, newline));
    } else if (getType(opts.header) === "Array") {
      fn(encodeCells(opts.header, delimiter, newline));
    }

    fn(encodeCells(row, delimiter, newline));

    for (var cur = 1, lim = getLimit(opts.limit, coll.length); cur < lim; cur++) {
      row = [];
      for (var key$1 = 0, len = header.length; key$1 < len; key$1++) {
        row.push(coll[cur][header[key$1]]);
      }
      fn(encodeCells(row, delimiter, newline));
    }

    return true;
  }

  function read(text, opts, fn) {
    var rows;

    if (getType(opts) === "Function") {
      fn = opts;
      opts = {};
    } else if (getType(fn) !== "Function") {
      rows = [];
      fn = rows.push.bind(rows);
    }

    opts = Object.assign({}, STANDARD_DECODE_OPTS, opts);

    if (!opts.delimiter || !opts.newline) {
      var limit = Math.min(48, Math.floor(text.length / 20), text.length);
      opts.delimiter = opts.delimiter || mostFrequent(text, CELL_DELIMITERS, limit);
      opts.newline = opts.newline || mostFrequent(text, LINE_DELIMITERS, limit);
    }

    return (text.indexOf(quoteMark) === -1 ? unsafeParse : safeParse)(text, opts, fn) &&
      (rows.length > 0 ? rows : true);
  }

  function write(coll, opts, fn) {
    var lines;

    if (getType(opts) === "Function") {
      fn = opts;
      opts = {};
    } else if (getType(fn) !== "Function") {
      lines = [];
      fn = lines.push.bind(lines);
    }

    opts = Object.assign({}, STANDARD_ENCODE_OPTS, opts);

    if (opts.skip > 0) {
      coll = coll.slice(opts.skip);
    }

    return (getType(coll[0]) === "Array" ? encodeArrays : encodeObjects)(coll, opts, fn) &&
      (lines.length > 0 ? lines.join(opts.newline) : true);
  }

  return {
    read: read,
    parse: read,
    write: write,
    encode: write
  };
}));


