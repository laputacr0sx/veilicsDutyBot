const { Telegraf } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf('1816582569:AAENdvfROXjnNdYNObuFkL7azXSImc1_I5A');
const dutyFile =
  'https://raw.githubusercontent.com/laputacr0sx/working-roster/master/mtr_duty.json';
var dutyList = [];

bot.command('start', ctx => {
  bot.telegram.sendMessage(ctx.chat.id, 'hello World:)');
});

bot.command('duty', ctx => {
  axios.get(dutyFile).then(response => {
    dutyList = Object.keys(response.data.duty);
  });
  console.log(
    dutyList.forEach(x => {
      text = x;
      callback_data = x;
    })
  );

  bot.telegram.sendMessage(ctx.chat.id, 'Please choose duty from below:', {
    reply_markup: {
      inline_keyboard: [[{ text: 'one', callback_data: 'one' }]],
    },
  });
});

bot.launch();
