let uidCounter = 0;

export function uid() {
  const result = uidCounter;
  uidCounter++;
  return result;
}
