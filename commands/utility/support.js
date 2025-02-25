const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('support')
		.setDescription('List all users with the support role')
		.setContexts(0),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const roleToFind = interaction.guild.roles.cache.get(process.env.SUPPORTROLE);
		if (!roleToFind) {
			return interaction.editReply('Support role not found.');
		}

		const members = await interaction.guild.members.fetch();
		const supporters = members
			.filter(member => member.roles.cache.has(roleToFind.id))
			.map(member => `<@${member.id}>`);

		const description = supporters.length > 0 
			? supporters.join('\n') 
			: 'No members have this role.';

		const embed = new EmbedBuilder()
			.setTitle('Support Team')
			.setDescription(description)
			.setColor(roleToFind.color || 0x00AE86)
			.setTimestamp();

		await interaction.editReply({ embeds: [embed], flags: 64 });
	},
};