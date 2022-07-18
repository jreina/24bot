export enum CardSuite {
  Heart = "heart",
  Diamond = "diamond",
  Spade = "spade",
  Club = "club",
}

export const RoyaltyMap = new Map([
  [1, "A"],
  [11, "J"],
  [12, "Q"],
  [13, "K"],
]);

export interface Card {
  suite: CardSuite;
  number: number;
  symbol: string;
}

export const Deck: Array<Card> = Array(13)
  .fill(0)
  .map((_, i) => i + 1)
  .flatMap((number) =>
    Object.values(CardSuite).map((suite) => ({
      suite,
      number,
      symbol: RoyaltyMap.get(number) ?? number.toString(),
    }))
  );
