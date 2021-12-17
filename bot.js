require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf(process.env.TOKEN);
const dutyFile = process.env.DUTYFILE;

bot.command('start', ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  bot.telegram.sendMessage(ctx.chat.id, 'hello World:)', {
    reply_markup: {
      remove_keyboard: true,
    },
  });
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
    ctx.telegram.sendMessage(
      ctx.chat.id,
      'Please use the keyboard to select appropriate roster',
      {
        reply_markup: {
          keyboard: kb,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  });
});

// bot.action('G15', ctx => {
//   let chosen = ctx.update.callback_query.data;
//   ctx.answerCbQuery('This is the G15 duty');
//   ctx.reply(`You have pressed ${chosen}`);
// });

bot.launch();
