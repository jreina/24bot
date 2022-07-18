import { Round } from "../game/game";

const safeEvalPattern = /[+*/\(\)0-9-]+/;

function safeEval(text: string) {
  const isSafe = safeEvalPattern.test(text);
  if (!isSafe) {
    return { valid: false, value: null };
  }
  const func = new Function("return " + text);
  const result = func() as number;
  return { valid: true, value: result };
}

export function parseExpression(expression: string, round: Round) {
  const patternNums = /(\d{1,2}).+?(\d{1,2}).+?(\d{1,2}).+?(\d{1,2})/;

  const result = patternNums.exec(expression);
  if (result === null) {
    return { valid: false, value: null };
  }
  const [, a, b, c, d] = result;
  const nums = [+a, +b, +c, +d];

  const hasAllFromRound = round
    .map((card) => nums.includes(card.number))
    .reduce((memo, val) => memo && val);
  if (!hasAllFromRound) {
    return { valid: false, value: null };
  }

  return safeEval(expression);
}
