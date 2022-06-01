const Discord = require("discord.js");
const { connectToDatabase } = require("./utils/mongodb");
const { ObjectId } = require("mongodb");

const prefix = "!";

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
const allInvites = {};
const invites = {};

const separateUsesAndCode = (allInvites, invites) => {
  allInvites.forEach(function (invite) {
    invites[invite.code] = { code: "", uses: 0 };
    invites[invite.code].code = invite.code;
    invites[invite.code].uses = invite.uses;
  });
  return invites;
};

const findInviteWithCode = (inviteList, code) => {
  // Loop through the invite list
  let inviteReturn;
  inviteList.forEach(function (invite) {
    // Check if the invite is equal to the code provided
    if (invite.code == code) {
      inviteReturn = invite;
      return invite; // If it is, we return it.
    }
  });
  return inviteReturn;
};

client.on("guildMemberAdd", (member) => {
  const test = "hello";
  member.send({
    content: `https://discord.com/api/oauth2/authorize?client_id=977113657878151208&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Ftest%3Fcreator%3D${test}&response_type=code&scope=identify%20email%20guilds`,
  });
});
client.on("ready", async () => {
  const allGuilds = await client.guilds.cache;

  allGuilds.forEach(myFunction);
  async function myFunction(guild) {
    allInvites[guild.id] = await guild.invites.fetch();
  }
  console.log("Bot is online");
});
// client.on("guildMemberAdd", async (member) => {
//   // console.log(invites, Object.keys(invites).length);
//   const invitesBeforeJoin = separateUsesAndCode(
//     allInvites[member.guild.id],
//     invites
//   );
//   const invitesAfterJoin = await member.guild.invites.fetch();
//
//   invitesAfterJoin.forEach(function (invite) {
//     if (
//       invitesBeforeJoin[invite.code].uses <
//       findInviteWithCode(invitesAfterJoin, invitesBeforeJoin[invite.code].code)
//         .uses
//     ) {
//       console.log(`Member ${member.displayName} Joined`);
//       console.log(`Invite Code: ${invitesBeforeJoin[invite.code].code}`);
//     }
//   });
//
//   console.log(`a user joins a guild: ${member}`);
// });

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix)) return;

  console.log("Message", message);

  if (message.content.startsWith("!auth-")) {
    const userId = message.content.split("-")[1];
    const { db } = await connectToDatabase();

    const getUserRes = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    console.log(getUserRes);
    const allGuildUsers = await message.guild.members.fetch();
    const riyaRole = message.guild.roles.cache.find(
      (role) => role.name === "riya"
    );
    const addRole = await allGuildUsers
      .get("927859258224148511")
      .roles.add(riyaRole);
    console.log(addRole);

    // axios
    //   .get("https://discord.com/api/v8/users/@me", {
    //     headers: {
    //       Authorization: "Bearer SAnOpvfwtbmJSX9E8NPgQpVt6t3NHb",
    //     },
    //   })
    //   .then((result) => {
    //     console.log("Result", result.data.add());
    //   })
    //   .catch((e) => {
    //     console.error(e);
    //   });

    // const embed = new Discord.MessageEmbed({
    //   description: `https://superfandom.io?id=${message.author.id}&username=${message.author.username}&disc=${message.author.discriminator}`,
    //   color: "BLUE",
    // });
    // const options = {
    //   content: "Please click on the link below",
    //   embeds: [embed],
    // };
    // const messagePayload = new Discord.MessagePayload(message.author, options);
    // message.author.send(messagePayload);
  }
});

client.login(
  "OTc3MTEzNjU3ODc4MTUxMjA4.GFSiOe.xQzvvVSTohMMcJtiAPmGOhY4avjcNpK0IcLvNE"
);
