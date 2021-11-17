require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf(process.env.TOKEN);
const dutyFile = process.env.DUTYFILE;
var button = {};
var keyboard = [[]];

bot.command('start', ctx => {
  bot.telegram.sendMessage(ctx.chat.id, 'hello World:)');
});

bot.command('duty', ctx => {
  axios.get(dutyFile).then(response => {
    Object.keys(response.data.duty).forEach(x => {
      button.text = x;
      button.callback_data = x;
      keyboard.push([button]);
      console.log(keyboard);
    });
  });

  bot.telegram.sendMessage(ctx.chat.id, 'Please choose duty from below:', {
    reply_markup: {
      inline_keyboard: [[]],
    },
  });
});

bot.launch();
