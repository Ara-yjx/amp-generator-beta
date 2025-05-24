let uidCounter = 0;

export function uid() {
  uidCounter++;
  return uidCounter;
}

export function setUidCounter(newUidCounter: number) {
  uidCounter = newUidCounter;
}

export function getUidCounter() {
  return uidCounter;
}
