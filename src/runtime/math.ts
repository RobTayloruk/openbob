const tokenRegex = /\s*([0-9]*\.?[0-9]+|[()+\-*/])\s*/gy;

export function evaluateExpression(input: string): number {
  const tokens = tokenize(input);
  let index = 0;

  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const op = tokens[index++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const op = tokens[index++];
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new Error("Division by zero.");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  };

  const parseFactor = (): number => {
    const token = tokens[index];
    if (token === "(") {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ")") throw new Error("Missing closing parenthesis.");
      index += 1;
      return value;
    }

    if (token === "-") {
      index += 1;
      return -parseFactor();
    }

    if (!token || Number.isNaN(Number(token))) {
      throw new Error("Expected a number.");
    }

    index += 1;
    return Number(token);
  };

  const result = parseExpression();
  if (index !== tokens.length) throw new Error("Unexpected token in expression.");
  return result;
}

function tokenize(input: string): string[] {
  tokenRegex.lastIndex = 0;
  const tokens: string[] = [];

  while (tokenRegex.lastIndex < input.length) {
    const match = tokenRegex.exec(input);
    if (!match) throw new Error("Invalid character in expression.");
    tokens.push(match[1]);
  }

  if (!tokens.length) throw new Error("Expression is empty.");
  return tokens;
}
