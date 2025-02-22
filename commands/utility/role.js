const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { logger } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
            .setName('addrole')
            .setDescription('Add the support role to a user')
		.addUserOption(option =>
            option.setName('user')
                .setDescription('User to modify')
                .setRequired(true)
        ),
	async execute(interaction) {
        await interaction.deferReply()
        if (!member.roles.cache.has(process.env.SUPPORTROLE) || member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: 'You don\'t have permission!', flags: 64})
        }

		const user = interaction.options.getUser('user');
        try {
            await interaction.member.roles.add(interaction.guild.roles.cache.get(process.env.SUPPORTROLE));
            await interaction.editReply('yes')
        } catch (err) {
            await interaction.editReply('no');
            logger.error(err)
        }
	},
};