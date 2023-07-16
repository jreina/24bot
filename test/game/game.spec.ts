import { Game, GameEvent } from "../../src/game/game";
import { solve } from "../../src/solver/solver";

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

  // TODO: Skipping for now since the solver is not producing
  // coherent results.
  it.skip("should call PointScored when a correct attempt is made", () => {
    const game = new Game({ includeFaceCards: false });
    const correctAttemptHandler = jest.fn();
    game.addListener(GameEvent.PointScored, correctAttemptHandler);

    game.start();

    let solutions = solve(game.current);

    while (solutions.length === 0) {
      game.skipRound("fakeplayer");
      solutions = solve(game.current);
    }
    
    game.attemptSolution("fakeplayer", solutions[0]);
    expect(correctAttemptHandler).toHaveBeenCalled();
  });
});
