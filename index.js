const { Client, GatewayIntentBits, Events, Collection } = require("discord.js");
const { token } = require("./config.json");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");

const client = new Client({ intents: GatewayIntentBits.Guilds });

client.commands = new Collection();

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required property.`);
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found. Ignoring interaction.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `There was an error while executing this command!`, ephemeral: true });
        } else {
            await interaction.reply({ content: `There was an error while executing this command!`, ephemeral: true });
        }
    }
})

client.once(Events.ClientReady, c => {
    console.log(`Bot online. Logged in as ${c.user.tag}.`);
});

client.login(token);