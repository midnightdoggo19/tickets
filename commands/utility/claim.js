const { SlashCommandBuilder } = require('discord.js');
const { claimTicket } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim a ticket')
		.addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to claim')
                .setRequired(true)
        )
		.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });
        const id = interaction.user.id;
        const channelid = interaction.options.getChannel('channel').id;

        const claim = await claimTicket(id, channelid);
        await interaction.editReply(claim);
	},
};