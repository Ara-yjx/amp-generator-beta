let uidCounter = 0;

export function uid() {
  uidCounter++;
  return uidCounter;
}
