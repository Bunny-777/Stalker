require('dotenv').config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Token from .env
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is missing in .env file.");
    process.exit(1);
}

// Initialize the Telegram bot
const bot = new TelegramBot(token, { polling: true });

app.use(express.json());

const dataFilePath = path.join(__dirname, 'tracking-data.json');

// Store tracking data
let trackingUsers = {};

// Load existing data if file exists
if (fs.existsSync(dataFilePath)) {
    try {
        const rawData = fs.readFileSync(dataFilePath);
        trackingUsers = JSON.parse(rawData);
    } catch (err) {
        console.error("Error reading tracking-data.json:", err);
    }
}

// Helper to save data
const saveData = () => {
    fs.writeFileSync(dataFilePath, JSON.stringify(trackingUsers, null, 2));
};

// Function to check LeetCode stats
const checkData = async (username, chatId) => {
    try {
        const apiUrl = `https://alfa-leetcode-api.onrender.com/${username}/solved`;
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        if (data.errors) {
            return; // Ignore invalid users during background check
        }

        const newEasy = data.easySolved;
        const newMedium = data.mediumSolved;
        const newHard = data.hardSolved;

        const user = trackingUsers[chatId];

        if (user && user.username === username) {
            const prevEasy = user.easySolved || 0;
            const prevMedium = user.mediumSolved || 0;
            const prevHard = user.hardSolved || 0;

            // Check if any new problem is solved
            if (newEasy > prevEasy || newMedium > prevMedium || newHard > prevHard) {
                let message = `🎉 ${username} solved a new problem!\n`;
                if (newEasy > prevEasy) message += `Oyee ${username} ne naya easy solve kar diya ab Easy ${prevEasy} → ${newEasy} ho gaye\n`;
                if (newMedium > prevMedium) message += `Oyee ${username} ne naya medium solve kar diya ab Medium: ${prevMedium} → ${newMedium} ho gaye\n`;
                if (newHard > prevHard) message += `Oyee ${username} ne naya hard solve kar diya ab Hard: ${prevHard} → ${newHard} ho gaye\n`;

                await bot.sendMessage(chatId, message);
                bot.sendMessage(chatId, "Tu bhi kuch kar Bunny 🤦‍♂️");
            }

            // Update tracking data
            trackingUsers[chatId] = {
                ...user,
                easySolved: newEasy,
                mediumSolved: newMedium,
                hardSolved: newHard,
            };
            saveData();
        }
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error.message);
    }
};

// --- Bot Commands ---

bot.onText(/\/register (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1].trim();

    try {
        // Fetch current stats when tracking starts
        const apiUrl = `https://alfa-leetcode-api.onrender.com/${username}/solved`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.errors) {
            return bot.sendMessage(chatId, `❌ Could not find LeetCode user: ${username}`);
        }

        const initialEasy = data.easySolved;
        const initialMedium = data.mediumSolved;
        const initialHard = data.hardSolved;

        // Initialize tracking with current stats
        trackingUsers[chatId] = {
            username: username,
            easySolved: initialEasy,
            mediumSolved: initialMedium,
            hardSolved: initialHard,
        };
        saveData();

        // Send initial message with current stats
        bot.sendMessage(
            chatId,
            `Yuhu!! 🔔 Started tracking ${username}!😉\n` +
            `❓To abhi ke stats ye he:\n` +
            ` Easy: ${initialEasy}😒\n` +
            ` Medium: ${initialMedium}😙\n` +
            ` Hard: ${initialHard}😮`
        );
    } catch (error) {
        console.error(`Error starting tracking for ${username}:`, error.message);
        bot.sendMessage(chatId, "Failed to start tracking. Please check the username and try again.");
    }
});

bot.onText(/\/unregister/, (msg) => {
    const chatId = msg.chat.id;

    if (!trackingUsers[chatId]) {
        return bot.sendMessage(chatId, "You are not tracking any username.");
    }

    const username = trackingUsers[chatId].username;
    delete trackingUsers[chatId];
    saveData();
    
    bot.sendMessage(chatId, `Tracking stopped for ${username}`);
});

bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;

    if (!trackingUsers[chatId]) {
        return bot.sendMessage(chatId, "You are not tracking any username. Use /register <username> first.");
    }

    const username = trackingUsers[chatId].username;
    
    try {
        const apiUrl = `https://alfa-leetcode-api.onrender.com/${username}/solved`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.errors) {
            return bot.sendMessage(chatId, `❌ Error fetching current stats for ${username}. User not found.`);
        }
        
        bot.sendMessage(
            chatId,
            `📊 Current stats for ${username}:\n` +
            ` Easy: ${data.easySolved}\n` +
            ` Medium: ${data.mediumSolved}\n` +
            ` Hard: ${data.hardSolved}`
        );
    } catch (error) {
        bot.sendMessage(chatId, `❌ Error fetching current stats for ${username}.`);
    }
});

// Single Background Loop
setInterval(() => {
    for (const [chatIdStr, userData] of Object.entries(trackingUsers)) {
        checkData(userData.username, chatIdStr);
    }
}, 60000); // 60 seconds

// Provide a dummy endpoint so the old frontend shows an alert
app.post("/start-tracking", (req, res) => {
    res.status(400).json({ success: false, message: "Please use the Telegram bot directly: send /register <your_leetcode_username> to the bot." });
});

// Serve the frontend
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Bot is polling for messages...`);
});