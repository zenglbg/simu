export const arrRange = (max: number, min = 0) =>
  Array.from({ length: max }, (item, index) => index + min);
