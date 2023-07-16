import { Game, GameEvent } from "../../src/game/game";

const mockPickSet = jest.fn();

jest.mock("chance", () => ({
  Chance: jest.fn().mockImplementation(() => ({
    pickset: mockPickSet,
  })),
}));

describe("Game", () => {
  beforeEach(() => {
    mockPickSet.mockReturnValue([1, 2, 3, 4].map((n) => ({ number: n })));
  });
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

  it("should automatically redraw if a round has no solution", () => {
    // first draw is bad
    mockPickSet.mockReturnValueOnce([
      { number: 1 },
      { number: 1 },
      { number: 1 },
      { number: 1 },
    ]);

    // second draw is good
    mockPickSet.mockReturnValueOnce([
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
    ]);

    const game = new Game({ includeFaceCards: false });
    const currentChangedHandler = jest.fn();
    game.addListener(GameEvent.CurrentChanged, currentChangedHandler);

    game.start();

    expect(currentChangedHandler).toHaveBeenCalledTimes(1);
    expect(currentChangedHandler).toHaveBeenCalledWith([
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
    ]);
  });

  it("should call GameFinished when a round has no solution and the deck is empty", () => {
    mockPickSet.mockRestore();
    mockPickSet.mockImplementation(set => set.slice(0, 4));

    const game = new Game({ includeFaceCards: false });
    const gameFinishedHandler = jest.fn();
    game.addListener(GameEvent.GameFinished, gameFinishedHandler);

    game.start();

    // empty the deck
    Array(4)
      .fill(0)
      .forEach(() => {
        game.skipRound("fakeplayer");
      });

    expect(gameFinishedHandler).toHaveBeenCalled();
  });
});
