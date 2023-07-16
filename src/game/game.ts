import { Card, Deck } from "./deck";
import { Chance } from "chance";
import EventEmitter from "events";
import { AnyRecord } from "dns";
import { Func } from "../types/Func";
import { parseExpression } from "../utils/parseExpression";

const CARDS_PER_ROUND = 4;

export type Round = [Card, Card, Card, Card];

interface PlayerData {
  id: string;
  score: number;
  cards: Array<Card>;
}

export enum GameEvent {
  DeckChanged = "onDeckChanged",
  PlayersChanged = "onPlayersChanged",
  DiscardsChanged = "onDiscardsChanged",
  CurrentChanged = "onCurrentChanged",
  GameFinished = "onGameFinished",
  PointScored = "onPointScored",
  AttemptIncorrect = "onAttemptIncorrect",
  AttemptInvalid = "onAttemptInvalid",
  RoundSkipped = "onRoundSkipped",
}

type GameConfig = {
  includeFaceCards: boolean;
  logger?: (message: string) => void;
};

export class Game {
  private _deck!: Array<Card>;
  private _discards: Array<Card> = [];
  private _current!: Round;
  private _chance = Chance();
  private _players: Array<PlayerData> = [];

  private _gameEventEmitter = new EventEmitter();

  constructor(private _gameConfig: GameConfig) {}

  public start(): void {
    this._initDeck();
    this._draw();
  }

  private _draw(): void {
    if (this._deck.length === 0) {
      this._log("Draw: No cards left in deck");
      this._gameEventEmitter.emit(GameEvent.GameFinished);
      return;
    }

    this._log("Drawing new round");
    this._current = this._chance.pickset(this._deck, CARDS_PER_ROUND) as Round;
    this._deck = this._deck.filter((item) => !this._current.includes(item));
    this._discards.push(...this._current);
    this._gameEventEmitter.emit(GameEvent.CurrentChanged, this._current);
    this._gameEventEmitter.emit(GameEvent.DeckChanged, this._deck);
    this._gameEventEmitter.emit(GameEvent.DiscardsChanged, this._discards);
  }

  public get current(): Round {
    return this._current;
  }

  public get discards(): Array<Card> {
    return this._discards;
  }

  public get deck(): Array<Card> {
    return this._deck;
  }

  public get players(): Array<PlayerData> {
    return this._players;
  }

  public attemptSolution(playerId: string, solution: string): void {
    this._log(`Player ${playerId} attempted solution ${solution}`);
    const result = parseExpression(solution, this._current);

    this._log(`Result: ${JSON.stringify(result)}`);

    if (!result.valid) {
      this._gameEventEmitter.emit(GameEvent.AttemptInvalid, {
        playerId,
        expr: solution,
      });
    } else if (result.value !== 24) {
      this._gameEventEmitter.emit(GameEvent.AttemptIncorrect, {
        playerId,
        expr: solution,
        value: result.value,
      });
    } else {
      this._addPoint(playerId);
      this._draw();
    }
  }

  public skipRound(playerId: string): void {
    this._log(`Player ${playerId} skipped round`);
    this._draw();
    this._gameEventEmitter.emit(GameEvent.RoundSkipped, this._current);
  }

  private _addPoint(playerId: string): void {
    this._log(`Player ${playerId} scored a point`);

    const player =
      this._players.find((player) => player.id === playerId) ||
      this._addPlayer(playerId);

    player.score += 1;
    player.cards.push(...this._current);
    this._gameEventEmitter.emit(GameEvent.PointScored, player);
  }

  /**
   * Adds an empty player with the specified id.
   */
  private _addPlayer(id: string) {
    this._log(`Adding player ${id}`);

    if (this._players.find((player) => player.id === id)) {
      this._log(`Player with id ${id} already exists`);
    }
    const player = { id, cards: [], score: 0 };
    this._players.push(player);
    this._gameEventEmitter.emit(GameEvent.PlayersChanged, this._players);
    return player;
  }

  public addListener(
    event: GameEvent.CurrentChanged,
    handler: Func<Round, void>
  ): void;
  public addListener(
    event: GameEvent.DeckChanged | GameEvent.DiscardsChanged,
    handler: Func<Array<Card>, void>
  ): void;
  public addListener(
    event: GameEvent.PlayersChanged,
    handler: Func<Array<PlayerData>, void>
  ): void;
  public addListener(event: GameEvent.GameFinished, handler: () => void): void;
  public addListener(
    event: GameEvent.PointScored,
    handler: Func<PlayerData, void>
  ): void;
  public addListener(
    event: GameEvent.RoundSkipped,
    handler: Func<Round, void>
  ): void;
  public addListener(
    event: GameEvent.AttemptIncorrect,
    handler: Func<{ playerId: string; expr: string; value: number }, void>
  ): void;
  public addListener(
    event: GameEvent.AttemptInvalid,
    handler: Func<{ playerId: string; expr: string }, void>
  ): void;
  public addListener(event: GameEvent, handler: Func<any, void>): void {
    this._gameEventEmitter.on(event, handler);
  }

  public removeListener(event: GameEvent, handler: Func<AnyRecord, void>) {
    this._gameEventEmitter.off(event, handler);
  }

  public restart(): void {
    this._log("Restarting game");

    this._players.forEach((player) => {
      player.score = 0;
      player.cards = [];
    });
    this._initDeck();
    this._draw();
    this._gameEventEmitter.emit(GameEvent.PlayersChanged, this._players);
  }

  private _initDeck(): void {
    this._deck = this._gameConfig.includeFaceCards
      ? [...Deck]
      : [...Deck.filter((card) => card.number < 11)];
  }

  private _log(message: string) {
    this._gameConfig.logger?.(message);
  }
}
