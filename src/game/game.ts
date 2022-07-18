import { Card, Deck } from "./deck";
import chance from "chance";
import EventEmitter from "events";
import { AnyRecord } from "dns";
import { Func } from "../types/Func";

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
}

export class Game {
  private _deck!: Array<Card>;
  private _discards: Array<Card> = [];
  private _current!: Round;
  private _chance = chance();
  private _players: Array<PlayerData> = [];

  private _gameEventEmitter = new EventEmitter();

  constructor(private _includeFaceCards = false) {
    this._initDeck();
  }

  public draw(): void {
    if (this._deck.length === 0) {
      this._gameEventEmitter.emit(GameEvent.GameFinished);
      return;
    }
    this._current = this._chance.pickset(this._deck, 4) as Round;
    this._deck = this._deck.filter((item) => !this._current.includes(item));
    this._discards.push(...this._current);
    this._gameEventEmitter.emit(GameEvent.CurrentChanged, this._current);
    this._gameEventEmitter.emit(GameEvent.DeckChanged, this._deck);
    this._gameEventEmitter.emit(GameEvent.DiscardsChanged, this._discards);
  }

  public get current() {
    return this._current;
  }

  public get discards() {
    return this._discards;
  }

  public get deck() {
    return this._deck;
  }

  public get players() {
    return this._players;
  }

  public addPoint(playerId: string) {
    const player =
      this._players.find((player) => player.id === playerId) ||
      this.addPlayer(playerId);

    player.score += 1;
    player.cards.push(...this._current);
  }

  /**
   * Adds an empty player with the specified id.
   */
  public addPlayer(id: string) {
    if (this._players.find((player) => player.id === id)) {
      throw new Error(`Player with id ${id} already exists`);
    }
    const player = { id, cards: [], score: 0 };
    this._players.push(player);
    return player;
  }

  public get gameEvents() {
    return this._gameEventEmitter;
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
  public addListener(event: GameEvent, handler: Func<any, void>): void {
    this._gameEventEmitter.on(event, handler);
  }

  public removeListener(event: GameEvent, handler: Func<AnyRecord, void>) {
    this._gameEventEmitter.off(event, handler);
  }

  public restart() {
    this._players.forEach((player) => {
      player.score = 0;
      player.cards = [];
    });
    this._initDeck();
    this.draw();
    this._gameEventEmitter.emit(GameEvent.PlayersChanged, this._players);
  }

  private _initDeck() {
    this._deck = this._includeFaceCards
      ? [...Deck]
      : [...Deck.filter((card) => card.number < 11)];
  }
}
