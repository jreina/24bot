import { config } from "dotenv";
if (!process.env.BOT_TOKEN) config();
if (!process.env.BOT_TOKEN)
  throw new Error("BOT_TOKEN env variable not set");

export default {
  botToken: process.env.BOT_TOKEN,
};
