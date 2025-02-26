const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const generator = require('generate-password');
const { logger, noPermission } = require('../../functions');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register an account on the dashboard')
	.setContexts(0),

	async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: noPermission, flags: 64})
        };

        const username = interaction.user.username;
        const password = await generator.generate({
            length: 8,
            numbers: true
        });

        const embed = new EmbedBuilder()
        .setTitle('New User')
        .addFields(
            { name: 'Username', value: username },
            { name: 'Password', value: password },
        )
        .setTimestamp();
    
        const res = await fetch(`http://${process.env.IP}:${process.env.PORT}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
    
        logger.debug(`${username} registered an account via a command`);

        if (res.ok) {
            await interaction.editReply({ embeds: [embed], flags: 64 });
        } else {
            await interaction.editReply({ content: 'An error occured, please try again in a moment.', flags: 64 });
        }
	},
};