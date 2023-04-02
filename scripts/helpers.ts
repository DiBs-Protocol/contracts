// async function that sleeps for the given seconds
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
