const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { editNote } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('editnote')
		.setDescription('Edit a note for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to edit note for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('note')
                .setDescription('New note')
                .setRequired(true)
        )
		.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply();

        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: noPermission, flags: 64});
            return;
        };
        const note = interaction.options.getString('note');
        const user = interaction.options.getUser('user');
        await editNote(user.id, note);

        const noteEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Edited Note for ${user.username}`)
            .setDescription(note)
            .setTimestamp();
            
        interaction.editReply({ embeds: [noteEmbed]});
	},
};