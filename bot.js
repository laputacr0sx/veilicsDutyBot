require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf(process.env.TOKEN);
const dutyFile = process.env.DUTYFILE;

bot.command('start', ctx => {
  bot.telegram.sendMessage(ctx.chat.id, 'hello World:)');
});

bot.command('duty', ctx => {
  let kb = [];
  axios.get(dutyFile).then(response => {
    Object.keys(response.data.duty).forEach(x => {
      let row = [];
      let button = {};
      button.text = x;
      button.callback_data = x;
      row.push(button);
      kb.push(row);
    });

    ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

    ctx.telegram.sendMessage(ctx.chat.id, 'Please choose duty from below:', {
      reply_markup: {
        inline_keyboard: kb,
      },
    });
  });
});

bot.action('G15', ctx => {
  let chosen = ctx.update.callback_query.data;
  ctx.answerCbQuery('This is the G15 duty');
  // ctx.telegram.sendChatAction('typing');
  ctx.reply(`You have pressed ${chosen}`);
});

bot.launch();
