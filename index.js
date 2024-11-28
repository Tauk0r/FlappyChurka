const express = require("express");
const path = require("path");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "7852630199:AAEIZuIGLU6nQabvxtd9BAMqjZ2WXAMQigg";
const server = express();
const bot = new TelegramBot(TOKEN, { polling: true });
const port = process.env.PORT || 5000;
const gameName = "FlappyChurka";
const queries = {};

server.use(express.static(path.join(__dirname, "FlappyChurka")));

// Функция записи в файл и логирования в консоль
const logUserData = (userId, username, displayName) => {
    const logEntry = `ID: ${userId}, Username: ${username || "Unknown"}, Display Name: ${displayName || "Unknown"}, Time: ${new Date().toISOString()}\n`;
    
    // Запись в файл
    fs.appendFile("user_data.txt", logEntry, (err) => {
        if (err) {
            console.error("Ошибка записи в файл:", err);
        } else {
            // Логирование в консоль
            console.log(`Записан пользователь: ID = ${userId}, Username = ${username || "Unknown"}, Display Name: ${displayName || "Unknown"}, Time: ${new Date().toISOString()}\n`);
        }
    });
};

// Команды бота
bot.onText(/help/, (msg) => bot.sendMessage(msg.from.id, "Say /game if you want to play."));
bot.onText(/start|game/, (msg) => {
    const userId = msg.from.id;
    const username = `${msg.from.username || "Unknown"} (${msg.from.first_name || ""} ${msg.from.last_name || ""})`;
    const displayName = msg.from.first_name || "Unknown";
    
    // Логируем пользователя
    logUserData(userId, username, displayName);

    bot.sendGame(msg.from.id, gameName);
});

bot.on("callback_query", function (query) {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery(query.id, "Sorry, '" + query.game_short_name + "' is not available.");
    } else {
        queries[query.id] = query;
        let gameurl = "https://tauk0r.github.io/FlappyChurka/";
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameurl
        });
    }
});

bot.on("inline_query", function (iq) {
    bot.answerInlineQuery(iq.id, [
        {
            type: "game",
            id: "0",
            game_short_name: gameName
        }
    ]);
});

// Сохранение рекордов
server.get("/highscore/:score", function (req, res, next) {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
    let query = queries[req.query.id];
    let options;
    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }
    bot.setGameScore(query.from.id, parseInt(req.params.score), options, function (err, result) {});
});

// Запуск сервера
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
