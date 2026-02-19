export function createTopicsMatcher(patterns: string[]) {
  const pats = patterns.map((p) => p.trim()).filter(Boolean);
  return (topic: string) => {
    for (const p of pats) {
      if (p === "*") return true;
      if (p.endsWith(".*")) {
        const prefix = p.slice(0, -2);
        if (topic === prefix || topic.startsWith(prefix + ".")) return true;
      } else if (p === topic) {
        return true;
      }
    }
    return false;
  };
}
