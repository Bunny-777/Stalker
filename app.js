// const express = require("express");
// const TelegramBot = require("node-telegram-bot-api");
// const axios = require("axios");

// const app = express();
// const PORT = 3000;

// // Replace with your Telegram bot token and chatId
// const token = "7574795378:AAEMviXsNUMTrhv_ggHh55IRcM5SogiOzwU";  
// const chatId = "6344734804"; // Hardcoded chatId

// // Initialize the Telegram bot
// const bot = new TelegramBot(token, { polling: false });

// app.use(express.json());

// // Store tracking data
// let trackingUsers = {};

// // Function to check LeetCode stats
// const checkData = async (username, chatId) => {
//     try {
//         const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;
//         const response = await axios.get(apiUrl);
//         const data = response.data;

//         const newEasy = data.easySolved;
//         const newMedium = data.mediumSolved;
//         const newHard = data.hardSolved;

//         if (trackingUsers[username] !== undefined) {
//             const prevEasy = trackingUsers[username].easySolved || 0;
//             const prevMedium = trackingUsers[username].mediumSolved || 0;
//             const prevHard = trackingUsers[username].hardSolved || 0;

//             // Check if any new problem is solved
//             if (newEasy > prevEasy || newMedium > prevMedium || newHard > prevHard) {
//                 let message = `🎉 ${username} solved a new problem!\n`;
//                 if (newEasy > prevEasy) message += `Oyee ${username} ne naya easy solve kar diya ab Easy ${prevEasy} → ${newEasy} ho gaye\n`;
//                 if (newMedium > prevMedium) message += `Oyee ${username} ne naya medium solve kar diya ab  Medium: ${prevMedium} → ${newMedium} ho gaye\n`;
//                 if (newHard > prevHard) message += `Oyee ${username} ne naya hard solve kar diya ab Hard: ${prevHard} → ${newHard} ho gaye\n`;

//                 await bot.sendMessage(chatId, message);
//                 bot.sendMessage(chatId,"Tu bhi kuch kar Bunny 🤦‍♂️");
//             }
//         }

//         // Update tracking data
//         trackingUsers[username] = {
//             easySolved: newEasy,
//             mediumSolved: newMedium,
//             hardSolved: newHard,
//             chatId: chatId,
//         };
//     } catch (error) {
//         console.error(`Error fetching data for ${username}:`, error);
//         bot.sendMessage(chatId, `❌ Error fetching data for ${username}. Please check the username and try again.`);
//     }
// };

// // Start tracking endpoint
// app.post("/start-tracking", (req, res) => {
//     const { username } = req.body;

//     if (!username) {
//         return res.status(400).json({ success: false, message: "Username is required" });
//     }

//     // Initialize tracking
//     trackingUsers[username] = {
//         easySolved: 0,
//         mediumSolved: 0,
//         hardSolved: 0,
//         chatId: chatId, // Use hardcoded chatId
//     };

//     // Send initial message with current stats
//     checkData(username, chatId).then(() => {
//         const { easySolved, mediumSolved, hardSolved } = trackingUsers[username];
//         bot.sendMessage(
//             chatId,
//             `Yuhu!! 🔔 Started tracking ${username}!😉\n` +
//             `❓To abhi ke stats ye he:\n` +
//             ` Easy: ${easySolved}😒\n` +
//             ` Medium: ${mediumSolved}😙\n` +
//             ` Hard: ${hardSolved}😮`
//         );
//     });

//     // Check every 10 seconds
//     setInterval(() => checkData(username, chatId), 10000);

//     res.json({ success: true, message: `Tracking started for ${username}` });
// });

// // Stop tracking endpoint
// app.post("/stop-tracking", (req, res) => {
//     const { username } = req.body;

//     if (!username || !trackingUsers[username]) {
//         return res.status(400).json({ success: false, message: "Username not being tracked" });
//     }

//     // Remove user from tracking
//     delete trackingUsers[username];
//     res.json({ success: true, message: `Tracking stopped for ${username}` });
// });

// // Serve the frontend
// app.use(express.static(__dirname));

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });



const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const app = express();
const PORT = 3000;

// Replace with your Telegram bot token and chatId
const token = "7574795378:AAEMviXsNUMTrhv_ggHh55IRcM5SogiOzwU";  
const chatId = "6344734804"; // Hardcoded chatId

// Initialize the Telegram bot
const bot = new TelegramBot(token, { polling: false });

app.use(express.json());

// Store tracking data
let trackingUsers = {};

// Function to check LeetCode stats
const checkData = async (username, chatId) => {
    try {
        const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        const newEasy = data.easySolved;
        const newMedium = data.mediumSolved;
        const newHard = data.hardSolved;

        if (trackingUsers[username] !== undefined) {
            const prevEasy = trackingUsers[username].easySolved || 0;
            const prevMedium = trackingUsers[username].mediumSolved || 0;
            const prevHard = trackingUsers[username].hardSolved || 0;

            // Check if any new problem is solved
            if (newEasy > prevEasy || newMedium > prevMedium || newHard > prevHard) {
                let message = `🎉 ${username} solved a new problem!\n`;
                if (newEasy > prevEasy) message += `Oyee ${username} ne naya easy solve kar diya ab Easy ${prevEasy} → ${newEasy} ho gaye\n`;
                if (newMedium > prevMedium) message += `Oyee ${username} ne naya medium solve kar diya ab Medium: ${prevMedium} → ${newMedium} ho gaye\n`;
                if (newHard > prevHard) message += `Oyee ${username} ne naya hard solve kar diya ab Hard: ${prevHard} → ${newHard} ho gaye\n`;

                await bot.sendMessage(chatId, message);
                bot.sendMessage(chatId, "Tu bhi kuch kar Bunny 🤦‍♂️");
            }
        }

        // Update tracking data
        trackingUsers[username] = {
            easySolved: newEasy,
            mediumSolved: newMedium,
            hardSolved: newHard,
            chatId: chatId,
        };
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error);
        bot.sendMessage(chatId, `❌ Error fetching data for ${username}. Please check the username and try again.`);
    }
};

// Start tracking endpoint
app.post("/start-tracking", async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    try {
        // Fetch current stats when tracking starts
        const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        const initialEasy = data.easySolved;
        const initialMedium = data.mediumSolved;
        const initialHard = data.hardSolved;

        // Initialize tracking with current stats
        trackingUsers[username] = {
            easySolved: initialEasy,
            mediumSolved: initialMedium,
            hardSolved: initialHard,
            chatId: chatId, // Use hardcoded chatId
        };

        // Send initial message with current stats
        bot.sendMessage(
            chatId,
            `Yuhu!! 🔔 Started tracking ${username}!😉\n` +
            `❓To abhi ke stats ye he:\n` +
            ` Easy: ${initialEasy}😒\n` +
            ` Medium: ${initialMedium}😙\n` +
            ` Hard: ${initialHard}😮`
        );

        // Check every 10 seconds
        setInterval(() => checkData(username, chatId), 10000);

        res.json({ success: true, message: `Tracking started for ${username}` });
    } catch (error) {
        console.error(`Error starting tracking for ${username}:`, error);
        res.status(500).json({ success: false, message: "Failed to start tracking. Please check the username and try again." });
    }
});

// Stop tracking endpoint
app.post("/stop-tracking", (req, res) => {
    const { username } = req.body;

    if (!username || !trackingUsers[username]) {
        return res.status(400).json({ success: false, message: "Username not being tracked" });
    }

    // Remove user from tracking
    delete trackingUsers[username];
    res.json({ success: true, message: `Tracking stopped for ${username}` });
});

// Serve the frontend
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});