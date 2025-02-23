const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { dataFile, noPermission } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist remove')
		.setDescription('Remove a user from the blacklist')
        .addUserOption(option =>
            option.setName('name')
                .setDescription('User to remove')
                .setRequired(true)
        )
        .setContexts(0),
	async execute(interaction) {
		await interaction.deferReply()
        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: noPermission, flags: 64})
        };

		const json = require(dataFile);
        const user = interaction.options.getUser('user');

        delete json[user.id];
        
        fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');

        interaction.editReply({ content: `Blacklisted <@${user.id}>`, flags: 64 });
	},
};