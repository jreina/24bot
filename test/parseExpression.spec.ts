import { expect } from "chai";
import { CardSuite } from "../src/game/deck";
import { parseExpression } from "../src/utils/parseExpression";

describe("parseExpression", () => {
  it("should evaluate the expression", () => {
    const result = parseExpression("(3 + 5) * (7 - 4)", [
      { number: 3, suite: CardSuite.Heart, symbol: "3" },
      { number: 5, suite: CardSuite.Heart, symbol: "5" },
      { number: 7, suite: CardSuite.Heart, symbol: "7" },
      { number: 4, suite: CardSuite.Heart, symbol: "4" },
    ]);

    expect(result).to.eql({ valid: true, value: 24 });
  });
});
