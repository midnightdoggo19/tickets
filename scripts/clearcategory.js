// simple util to clear all the channels in a category

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ],
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const guild = client.guilds.cache.get(process.env.GUILDID);
    if (!guild) return console.log('Guild not found');

    const categoryId = process.env.ARCHIVECATEGORY;
        const category = guild.channels.cache.get(categoryId);
    if (!category || category.type !== 4) {
        return console.log('Category not found or invalid');
    }

    const channels = category.children.cache;
    if (channels.size === 0) { console.log('No channels in the category'); process.exit() }

    for (const channel of channels.values()) {
        await channel.delete().catch(console.error);
        console.log(`Deleted channel: ${channel.name}`);
    }

    process.exit()
});

client.login(process.env.TOKEN);
