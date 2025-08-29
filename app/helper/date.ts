import isEmpty from "./isEmpty";
import moment from "moment";

export const momentFormat = (dateTime: string | Date | number, format: string = "YYYY-MM-DD HH:mm"): string => {
  try {
    if (!isEmpty(dateTime)) {
      let newDateTime = new Date(dateTime);
      return moment(newDateTime).format(format);
    }
    return "";
  } catch (err) {
    return "";
  }
};