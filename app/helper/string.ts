export const capitalize = (value: string): string => {
  if (typeof value !== "string") return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  } 
  return str;
}