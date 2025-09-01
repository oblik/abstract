const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadTSModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const module = { exports: {} };
  const dirname = path.dirname(filePath);
  const req = (p) => {
    if (p.startsWith('.')) {
      return loadTSModule(path.join(dirname, p + '.ts'));
    }
    return require(p);
  };
  const func = new Function('require', 'module', 'exports', '__dirname', '__filename', outputText);
  func(req, module, module.exports, dirname, filePath);
  return module.exports;
}

const { toFixedDown } = loadTSModule(path.join(__dirname, '../lib/roundOf.ts'));

describe('toFixedDown', () => {
  test('truncates decimals without rounding', () => {
    expect(toFixedDown('1.234', 2)).toBe('1.23');
  });

  test('handles negative numbers', () => {
    expect(toFixedDown('-1.234', 2)).toBe('-1.23');
  });

  test('returns original value when no decimals', () => {
    expect(toFixedDown('5', 2)).toBe('5');
  });

  test('returns original value for non-numeric input', () => {
    expect(toFixedDown('abc', 2)).toBe('abc');
  });
});
