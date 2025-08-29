export function convert(n: number): number | string {
    var sign = +n < 0 ? "-" : "",
      toStr = n.toString();
    if (!/e/i.test(toStr)) {
      return n;
    }
    var [lead, decimal, pow] = n
      .toString()
      .replace(/^-/, "")
      .replace(/^([0-9]+)(e.*)/, "$1.$2")
      .split(/e|\./);
    var powNum = Number(pow);
    return powNum < 0
      ? sign +
      "0." +
      "0".repeat(Math.max(Math.abs(powNum) - 1 || 0, 0)) +
      lead +
      decimal
      : sign +
      lead +
      (powNum >= decimal.length
        ? decimal + "0".repeat(Math.max(powNum - decimal.length || 0, 0))
        : decimal.slice(0, powNum) + "." + decimal.slice(powNum));
  }