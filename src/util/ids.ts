export function newId(prefix: string) {
  const r = Math.random().toString(16).slice(2);
  const t = Date.now().toString(16);
  return `${prefix}_${t}_${r}`;
}
