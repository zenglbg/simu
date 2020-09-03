export function sleep(time: number) {
  return new Promise((resolve, reject) =>
    setTimeout((_) => resolve(), time * 1000)
  );
}
