import Discord, { Message } from "discord.js";

import auth from "./config";
import { CardSuite } from "./game/deck";
import { Game, GameEvent, Round } from "./game/game";
import helpText from "./helpText";
import { parseExpression } from "./utils/parseExpression";

const logger = console;
const bot = new Discord.Client();
const GAMES = new Map<string, Game>();
const GAME_STATE = new Map<string, { lastDrawMessageId: string }>();

const suiteMap = {
  [CardSuite.Club]: ":clubs:",
  [CardSuite.Diamond]: ":diamonds:",
  [CardSuite.Heart]: ":hearts:",
  [CardSuite.Spade]: ":spades:",
};

function printRound([a, b, c, d]: Round, solutionCount?: number) {
  return `Here are your cards:
- ${a.symbol}${suiteMap[a.suite]}
- ${b.symbol}${suiteMap[b.suite]}
- ${c.symbol}${suiteMap[c.suite]}
- ${d.symbol}${suiteMap[d.suite]}
`;
}

function printScoreboard(game: Game) {
  return `${game.players
    .map(
      (player) =>
        `${player.id} has ${player.score} points, ${player.cards.length} cards`
    )
    .join("\n")}
    
    There are ${game.deck.length} cards left to play.`;
}

const commands: Array<{
  command: string;
  handler: (message: Message) => void;
}> = [
  {
    command: "help",
    handler: (message) => {
      message.channel.send(helpText);
    },
  },
  {
    command: "scoreboard",
    handler: (message) => {
      if (!message.guild) return;
      const game = GAMES.get(message.guild.id);
      if (!game) return;
      message.channel.send(printScoreboard(game));
    },
  },
  {
    command: "restart",
    handler: (message) => {
      if (!message.guild) return;
      const game = GAMES.get(message.guild.id);
      game?.restart();
    },
  },
  {
    command: "start",
    handler: async (message) => {
      if (!message.guild) return;
      if (GAMES.has(message.guild.id)) {
        message.channel.send("Game already in progress.");
        const activeGame = GAMES.get(message.guild.id) as Game;
        printRound(activeGame.current);
      } else {
        GAMES.set(message.guild.id, new Game(false));

        message.channel.send("Game started");

        const activeGame = GAMES.get(message.guild.id) as Game;
        activeGame.addListener(GameEvent.CurrentChanged, async (round) => {
          const roundMessage = await message.channel.send(printRound(round));
          if (!message.guild) return;
          GAME_STATE.set(message.guild.id, {
            lastDrawMessageId: roundMessage.id,
          });
        });
        activeGame.addListener(GameEvent.GameFinished, () => {
          message.channel.send(`Game over! Here's the final scoreboard:
          ${printScoreboard(activeGame)}`);
        });
        activeGame.draw();
      }
    },
  },
];

function inGameResponseHandler(message: Message) {
  if (!message.guild || !message.member?.id) return;

  const game = GAMES.get(message.guild.id);
  if (!game) return;

  if (message.content.includes("skip")) {
    return game.draw();
  }

  const parseResult = parseExpression(message.content, game.current);
  if (parseResult.valid && parseResult.value === 24) {
    game.addPoint(message.member.displayName);

    message.channel.send(`${
      message.member.user.tag
    } got it! Here's the scoreboard:
    ${printScoreboard(game)}
  `);
    game.draw();
  } else if (!parseResult.valid) {
    message.channel.send(`${message.content} is not valid`);
  } else if (parseResult.valid && parseResult.value !== 24) {
    message.channel.send(
      `${message.content} evaluates to ${parseResult.value}`
    );
  }
}

bot.login(auth.botToken).then((_) => {
  bot.on("ready", function () {
    if (!bot.user) return;
    logger.info("Connected");
    logger.info("Logged in as:", bot.user.tag);
    bot.user.setActivity({ type: "LISTENING", name: "24!help" });
  });
  bot.on("message", withMatchingMessage(processCommands));
  bot.on("message", withResponseToBot(inGameResponseHandler));
});

function processCommands(message: Message) {
  const command = commands.find(({ command }) =>
    message.content.includes(command)
  );
  if (!command) return;
  command.handler(message);
}

function withMatchingMessage(handler: (message: Message) => void) {
  return function (message: Message) {
    if (message.content.startsWith("24!")) {
      handler(message);
    }
  };
}

function withResponseToBot(handler: (message: Message) => void) {
  return function (message: Message) {
    if (!message.guild || !message.reference || !message.member?.id) return;
    const gameState = GAME_STATE.get(message.guild.id);
    if (!gameState) return;
    if (gameState.lastDrawMessageId !== message.reference.messageID) return;
    handler(message);
  };
}
