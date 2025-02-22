const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { logger, noPermission } = require('../../functions');

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
        await interaction.deferReply({flags: 64})
        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({ content: noPermission, flags: 64 });
        };

		const user = interaction.options.getUser('user');
        try {
            await interaction.member.roles.add(interaction.guild.roles.cache.get(process.env.SUPPORTROLE));
            await interaction.editReply({ content: `Added role to ${user.id}.`, flags: 64 })
        } catch (err) {
            await interaction.editReply({ content: 'Couldn\'t add role.', flags: 64 });
            logger.error(err)
        }
	},
};