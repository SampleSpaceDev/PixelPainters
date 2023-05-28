const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");

const commands = [];
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required property.`);
    }
}

const rest = new REST().setToken(token);
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`Successfully refreshed ${data.length} application commands.`);
    } catch (error) {
        console.error(error);
    }
})();