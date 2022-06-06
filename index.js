require("dotenv").config();
const jwt = require("jsonwebtoken");
const Discord = require("discord.js");
const axios = require("axios").default;
const { connectToDatabase } = require("./utils/mongodb");
const { ObjectId } = require("mongodb");

const authorizationLink = (data) => {
  const secretKey = process.env.PRIVATE_KEY;
  const token = jwt.sign(data, secretKey);
  const authLink = `https://discord.com/api/oauth2/authorize?client_id=981498317714391091&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flink%2Fdiscord&response_type=code&scope=identify%20email%20guilds&state=${data}`;

  const embedMessage = new Discord.MessageEmbed({
    title: "Verify your account",
    description:
      "To verify your account through Superfandom, please click on the button below",
  });
  const messageButton = new Discord.MessageButton({
    label: "Verify",
    url: authLink,
    style: "LINK",
  });
  const messageActionRow = new Discord.MessageActionRow({
    components: [messageButton],
  });

  return { embeds: [embedMessage], components: [messageActionRow] };
};

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

client.on("messageCreate", async (message) => {
  if (message.content === "!welcome-message") {
    const channelId = message.channelId;
    await createCreatorNftMessage(channelId, message);
  }
  if (message.content.startsWith("!auth") && message.author.bot) {
    const splitMessage = message.content.split(" ");
    const superfandomUserId = splitMessage[1];

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

    const discordUserToken = findUser.linkedAccounts.discord;
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

    const getRole = await currentGuild.roles.cache.find((role) =>
      role.name.includes("Riya's Inner")
    );
    await currentGuildMember.roles.add(getRole);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.author.id === process.env.DISCORD_BOT_ID) {
    console.log(reaction.message);
    await user.send(authorizationLink("riyasen"));
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
