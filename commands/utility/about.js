const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTotalTickets, getLatestCommit, logger } = require('../../functions');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about the bot')
	.setContexts(0, 1),
	async execute(interaction) {
		// await interaction.deferReply({ flags: 64 });
		await interaction.deferReply();
        const total = await getTotalTickets();
        let webhook;

        if (process.env.LOGHOOK) { webhook = true } else { webhook = false }

        try {
            const about = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Support Tickets')
                .setURL('https://github.com/midnightdoggo19/tickets')
                .setAuthor({ name: 'Midnight Doggo', iconURL: 'https://avatars.githubusercontent.com/u/71900479?v=4', url: 'https://midnightdoggo19.com' })
                .setDescription('Yet another ticket bot for Discord')
                .addFields(
                    { name: 'Support Role', value: `<@&${process.env.SUPPORTROLE}>`},
                    { name: 'Total Tickets', value: total || 'idk'},
                    // { name: 'Latest commit information', value:  await getLatestCommit() || 'Couldn\'t get latest commit!' },
                    { name: 'Webhook enabled?', value: String(webhook) }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [about] });
        } catch (e) {
            logger.error(`err: ${e}`);
            await interaction.deleteReply();
        }
	},
};