import isEmpty from "./isEmpty";

export const toFixedDown = (item: string | number, type: number = 2): string | number => {
  try {
      if (!isEmpty(item) && !isNaN(Number(item))) {
          const num = parseFloat(item as string);
          const decReg = new RegExp("(-?\\d+\\.\\d{" + type + "})(\\d)"),
              m = num.toString().match(decReg);
          return m ? parseFloat(m[1]) : num.valueOf();
      }
      return "";
  } catch (err) {
      return "";
  }
};