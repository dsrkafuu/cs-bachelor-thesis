export function numSorter(a: number, b: number) {
  return a - b;
}

export function strSorter(a: string, b: string) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
