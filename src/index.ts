import Discord, { Message } from "discord.js";

import auth from "./config";
import { CardSuite } from "./game/deck";
import { Game, GameEvent, Round } from "./game/game";
import { solve } from "./solver/solver";

const logger = console;
const bot = new Discord.Client();
const GAMES = new Map<string, Game>();

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

There are ${solutionCount} solutions to this round.
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
  helpText: string;
}> = [
  {
    command: "help",
    handler: (message) => {
      message.channel.send(`24 Bot
Commands:
      
${commands.map(({ command, helpText }) => `\`24!${command}\` ${helpText}`).join("\n")}`);
    },
    helpText: "Prints this help text",
  },
  {
    command: "scoreboard",
    handler: (message) => {
      if (!message.guild) return;
      const game = GAMES.get(message.guild.id);
      if (!game) return;
      message.channel.send(printScoreboard(game));
    },
    helpText: "Prints the current scoreboard",
  },
  {
    command: "restart",
    handler: (message) => {
      if (!message.guild) return;
      const game = GAMES.get(message.guild.id);
      game?.restart();
    },
    helpText: "Restarts the current game",
  },
  {
    command: "start",
    handler: async (message) => {
      if (!message.guild) return;
      if (GAMES.has(message.guild.id)) {
        message.channel.send("Game already in progress.");
      } else {
        const guild = message.guild;
        const activeGame = new Game({
          includeFaceCards: false,
          logger: logMessage => {
            console.log(`[${new Date().toISOString()}] [${guild.id}] ${logMessage}`);
          }
        });
        GAMES.set(guild.id, activeGame);

        const gameState = {
          lastDrawMessageId: message.id,
        };

        message.channel.send("Game started");

        activeGame.addListener(GameEvent.PointScored, (player) => {
          message.channel.send(
            `${player.id} scored a point! ${player.score} points total.
            
            ${printScoreboard(activeGame)}`
          );
        });

        activeGame.addListener(GameEvent.RoundSkipped, async (round) => {
          const solutions = solve(activeGame.current);
          const skipMessage = await message.channel.send(
            `Round skipped! Here's the next round:
            ${printRound(round, solutions.length)}`
          );

          gameState.lastDrawMessageId = skipMessage.id;
        });

        activeGame.addListener(GameEvent.GameFinished, () => {
          message.channel.send(`Game over! Here's the final scoreboard:
          ${printScoreboard(activeGame)}`);
          activeGame.restart();
        });

        activeGame.addListener(GameEvent.CurrentChanged, async (round) => {
          const solutions = solve(round);
          const roundMessage = await message.channel.send(
            printRound(round, solutions.length)
          );
          gameState.lastDrawMessageId = roundMessage.id;
        });

        activeGame.addListener(
          GameEvent.AttemptIncorrect,
          ({ expr, playerId, value }) => {
            message.channel.send(
              `Incorrect! ${playerId} said ${expr} which evaluates to ${value}`
            );
          }
        );

        activeGame.addListener(
          GameEvent.AttemptInvalid,
          ({ expr, playerId }) => {
            message.channel.send(
              `Invalid expression! ${playerId} said ${expr}`
            );
          }
        )

        activeGame.start();
      }
    },
    helpText: "Starts a new game",
  },
  {
    command: "bug",
    handler: (message) => {
      message.channel.send(
        "Find an issue? You can report bugs here: https://github.com/jreina/24bot/issues"
      );
    },
    helpText: "Report a bug",
  }
];

/**
 * Handles messages that are sent in response to the bot's messages.
 */
async function inGameResponseHandler(message: Message) {
  if (!message.guild || !message.member?.id) return;

  const game = GAMES.get(message.guild.id);
  if (!game) return;

  if (message.content.includes("skip")) {
    return game.skipRound(message.member.id);
  }

  game.attemptSolution(message.member.displayName, message.content);
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

function withResponseToBot(
  handler: (message: Message) => void
) {
  return function (message: Message) {
    if (!message.guild || !message.reference || !message.member?.id) return;

    handler(message);
  };
}
