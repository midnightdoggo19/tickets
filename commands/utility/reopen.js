const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reopen, noPermission, logger } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reopen')
		.setDescription('Reopen a ticket')
		.setContexts(0, 1),

	async execute(interaction) {
		// await interaction.deferReply({ flags: 64 });
        // if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ PermissionsBitField.Flags.ModerateMembers ])) { await interaction.editReply({content: noPermission, flags: 64}); return; };
        // logger.debug(interaction.channel.id);
        // const channel = await reopen(interaction.channel.id);
        // await interaction.editReply({ content: `Ticket reopened: <#${channel.id}>`, flags: 64 });
        await interaction.reply('Under construction :D');
	},
};