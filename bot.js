const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const bot = new Telegraf('1816582569:AAEbb86GDmxEP67UDET8SDvrcAfE7XXfZZo');

let url =
  'https://raw.githubusercontent.com/laputacr0sx/working-roster/master/mtr_duty.json';

bot.command('start', ctx => {
  ctx.reply("let's get started!");
});

bot.command('duty', ctx => {
  axios
    .get(url)
    .then(res => {
      ctx.reply(Object.keys(res.data.duty));
      let roster = Object.keys(res.data.duty);
      ctx.telegram.sendMessage(ctx.chat.id, 'Please Select roster', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1', callback_data: 1 },
              { text: '2', callback_data: 2 },
              { text: '3', callback_data: 3 },
            ],
          ],
        },
      });
    })
    .catch(e => {
      console.log(e);
    });
});

bot.launch();
