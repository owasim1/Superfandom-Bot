require("dotenv").config();
const Discord = require("discord.js");
const axios = require("axios").default;
const { connectToDatabase } = require("./utils/mongodb");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const creatorWelcomeMessages = JSON.parse(
  JSON.stringify(require("./creator-welcome-messages.json"))
);

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

const createCreatorNftMessage = async (channelId, message, creatorUsername) => {
  const creatorData = creatorWelcomeMessages[creatorUsername];
  const embeddedData = creatorData["embedMessage"];
  const creatorRoles = creatorData["roles"];
  const creatorGuildId = creatorData["guildId"];
  const creatorNftId = creatorData["nftId"];

  const payload = {
    0: [creatorRoles, creatorGuildId, creatorUsername, creatorNftId],
  };
  const token = jwt.sign(JSON.stringify(payload), process.env.PRIVATE_KEY);

  const authLink = `https://discord.com/api/oauth2/authorize?client_id=981498317714391091&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flink%2Fdiscord&response_type=code&scope=guilds%20email%20identify%20guilds.join&state=${token}`;
  // const authLink = `https://discord.com/api/oauth2/authorize?client_id=981498317714391091&redirect_uri=https%3A%2F%2Fdev-sf-webapp-ten.vercel.app%2Flink%2Fdiscord&response_type=code&scope=identify%20email%20guilds&state=${token}`;

  const embeddedMessage = new Discord.MessageEmbed(embeddedData);
  const messageButton = new Discord.MessageButton({
    label: "Verify",
    url: authLink,
    style: "LINK",
  });
  const messageActionRow = new Discord.MessageActionRow({
    components: [messageButton],
  });
  const channel = await client.channels.cache.find(
    (channel) => channel.id === channelId
  );

  if (embeddedData) {
    channel.send({ embeds: [embeddedMessage], components: [messageActionRow] });
  }
  await message.delete();
};

client.on("ready", async () => {
  await fetchMessagesFromAllGuilds();
  console.log("Bot is online");
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!welcome-message")) {
    const splitMessage = message.content.split(" ");
    const creatorUsername = splitMessage[1];
    const channelId = message.channelId;
    await createCreatorNftMessage(channelId, message, creatorUsername);
  }
  if (message.content.startsWith("!auth") && message.author.bot) {
    const splitMessage = message.content.split(" ");
    const superfandomUserId = splitMessage[1];
    const roleId = splitMessage[2];

    const { db } = await connectToDatabase();

    const findUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(superfandomUserId) });

    if (!findUser) {
      const err = {
        status: false,
        statusMsg: "No Superfandom user found using the given userID",
      };
      console.error(err);

      return err;
    }

    const discordUserToken = findUser.linkedAccounts.find(
      (account) => account.service === "discord"
    );
    const discordUser = await axios.get(
      "https://discord.com/api/v8/users/@me",
      {
        headers: {
          Authorization: `Bearer ${discordUserToken.access_token}`,
        },
      }
    );

    const currentGuild = await client.guilds.cache.find(
      (guild) => guild.id === message.guildId
    );

    const currentGuildMember = await currentGuild.members.cache.find(
      (user) => discordUser.data.id === user.id
    );

    const getRole = await currentGuild.roles.cache.find(
      (role) => role.id == roleId
    );
    await currentGuildMember.roles.add(getRole);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
