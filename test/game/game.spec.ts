import { Game, GameEvent } from "../../src/game/game";

jest.mock("chance", () => ({
  Chance: jest.fn().mockImplementation(() => ({
    pickset: jest
      .fn()
      .mockReturnValue([1, 2, 3, 4].map((n) => ({ number: n }))),
  })),
}));

describe("Game", () => {
  it("should call DeckChanged when the game starts", () => {
    const game = new Game({ includeFaceCards: false });
    const deckChangedHandler = jest.fn();
    game.addListener(GameEvent.DeckChanged, deckChangedHandler);

    game.start();

    expect(deckChangedHandler).toHaveBeenCalled();
  });

  it("should call InvalidAttempt when an invalid attempt is made", () => {
    const game = new Game({ includeFaceCards: false });
    const invalidAttemptHandler = jest.fn();
    game.addListener(GameEvent.AttemptInvalid, invalidAttemptHandler);

    game.start();
    game.attemptSolution("fakeplayer", "1 + 1");

    expect(invalidAttemptHandler).toHaveBeenCalled();
  });

  it("should call IncorrectAttempt when an incorrect attempt is made", () => {
    const game = new Game({ includeFaceCards: false });
    const incorrectAttemptHandler = jest.fn();
    game.addListener(GameEvent.AttemptIncorrect, incorrectAttemptHandler);

    game.start();
    game.attemptSolution(
      "fakeplayer",
      game.current.map((c) => c.number).join(" - ")
    );

    expect(incorrectAttemptHandler).toHaveBeenCalled();
  });

  it("should call PointScored when a correct attempt is made", () => {
    const game = new Game({ includeFaceCards: false });
    const correctAttemptHandler = jest.fn();
    game.addListener(GameEvent.PointScored, correctAttemptHandler);

    game.start();

    game.attemptSolution("fakeplayer", "4*3*2*1");

    expect(correctAttemptHandler).toHaveBeenCalled();
  });
});
