const { SlashCommandBuilder, AttachmentBuilder, escapeMarkdown } = require("discord.js");
const { JSDOM } = require("jsdom");
const { get } = require("axios");
const { channelId } = require("../config.json");
const URL_PATTERN = /^https:\/\/hypixel\.net\/pp\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i;

module.exports = {
    data: new SlashCommandBuilder()
    .setName("save")
    .setDescription("Save a Pixel Painters drawing forever!")
    .addStringOption(option => option
        .setName("url")
        .setDescription("The URL given to you. Format: \"https://hypixel.net/pp/<id>\".")
        .setRequired(true)
    ),

    async execute(interaction) {
        const url = interaction.options.getString("url");

        if (URL_PATTERN.test(url) == false) {
            await interaction.reply({ content: `Please provide a URL in the correct format.`, ephemeral: true });
            return;
        }

        const doc = await getWebsiteData(url);
    
        if (doc == null) {
            await interaction.reply({ content: `There was an error when reading the website!`, ephemeral: true });
            return;
        }
    
        const theme = doc.querySelector('.theme').textContent;
        const artist = `By: **${escapeMarkdown(doc.querySelector('.pp-user').textContent.trim())}**`;
        
        const match = url.match(URL_PATTERN);
        const imageUrl = `https://pp.hypixel.net/${match[1]}.png`;

        const attachment = await getImage(imageUrl, theme);
    
        if (attachment == null) {
            await interaction.reply({ content: `There was an error when downloading the image!`, ephemeral: true });
            return;
        }

        await interaction.channel.send({
            content: emphasise(theme) + `\n${artist}`,
            files: [attachment]
        });
        await interaction.reply({ content: `Saved!`, ephemeral: true });
    }
}

async function getWebsiteData(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // Parse the HTML content using DOMParser
        const dom = new JSDOM(html);

        return dom.window.document;
    } catch (error) {
        // console.error('Error:', error);
        return null;
    }
}

async function getImage(url, theme) {
    try {
        const response = await get(url, { responseType: 'arraybuffer' });

        // Create a buffer from the image data
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Create a Discord MessageAttachment from the buffer
        const attachment = new AttachmentBuilder(imageBuffer);
        attachment.setDescription(theme);

        return attachment;
    } catch (error) {
        console.error('Error sending image as attachment:', error);

        return null;
    }
}

function emphasise(input) {
    const [key, value] = input.split(':').map(part => part.trim());
    return (value !== undefined) ? `${key}: **${value}**` : input;
}