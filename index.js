require("dotenv").config();
const Discord = require("discord.js");

const client = new Discord.Client({
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_PRESENCES",
    "GUILD_MEMBERS",
    "GUILD_MESSAGE_REACTIONS",
  ],
});

const fetchMessagesFromAllGuilds = async () => {
  const allGuilds = await client.guilds.cache;
  let allChannels;
  for (const guild of allGuilds) {
    allChannels = await guild[1].channels.fetch();
  }
  for (const channel of allChannels) {
    if (channel[1].type === "GUILD_TEXT") {
      await channel[1].messages.fetch();
    }
  }
};

const createCreatorNftMessage = async (channelId, message) => {
  const embeddedData = {
    title: "Buy Riya's NFT to chat directly with her 😊",
    description:
      "To buy the NFT, go here: https://superfandom.io/nft/620e4d1b2f4adb8369619a4a",
    image: {
      url: "https://images-ext-2.discordapp.net/external/HQJD2ekgkhWjqNP-q02gyUBCsfTQvLMpXlb5TvAQGG8/https/cdn-longterm.mee6.xyz/plugins/embeds/images/976911670024757288/8e9e15fecefece255526546d06e19abb0c4236d65386afbf813999e4812b4d87.png?width=458&height=458",
    },
    footer: {
      text: "In case you've already bought the NFT, react to this message",
    },
  };
  const embeddedMessage = new Discord.MessageEmbed(embeddedData);
  const channel = await client.channels.cache.find(
    (channel) => channel.id === channelId
  );
  channel.send({ embeds: [embeddedMessage] });
  await message.delete();
};

client.on("ready", async () => {
  await fetchMessagesFromAllGuilds();
  console.log("Bot is online");
});
client.on("guildMemberAdd", (member) => {});

client.on("messageCreate", async (message) => {
  if (message.content !== "!welcome-message") return;
  const channelId = message.channelId;

  await createCreatorNftMessage(channelId, message);
});

client.on("messageReactionAdd", async (reaction) => {
  console.log("Reaction", reaction);
});

client.login(process.env.DISCORD_BOT_TOKEN);
