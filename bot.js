require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf(process.env.TOKEN);
const dutyFile = process.env.DUTYFILE;

bot.command('start', ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  bot.telegram.sendMessage(
    ctx.chat.id,
    `請輸入想查詢之更份
如 129 / 525 / 881103A / 992701A 等`,
    {
      reply_markup: {
        remove_keyboard: true,
      },
    }
  );
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

bot.hears(/^[135][0-5][0-9]/, ctx => {
  console.log(ctx.match[0]);
  bot.on(ctx.match[0], ctx => {
    console.log(ctx);
  });
});

bot.hears(/^8\d{5}[A-Z]?/, ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  bot.telegram.sendMessage(ctx.chat.id, 'Searching in Training ...');
  axios.get(dutyFile).then(response => {
    if (!response.data.duty.Training[ctx.match[0]]) {
      bot.telegram.sendChatAction(ctx.chat.id, 'typing');
      bot.telegram.sendMessage(ctx.chat.id, 'Sorry I cannot find your duty ');
    } else {
      const dutyRequired = response.data.duty.Training[ctx.match[0]];
      ctx.deleteMessage();
      bot.telegram.sendMessage(
        ctx.chat.id,
        `您查詢的${ctx.match[0]}更份資料如下
        開工地點：${dutyRequired.bookOnLocation}
        開工時間：${dutyRequired.bookOnTime}
        收工時間：${dutyRequired.bookOffTime}
        收工地點：${dutyRequired.bookOffLocation}
        工時：${dutyRequired.duration}
        備註：${dutyRequired.remarks}`
      );
    }
  });
});
bot.launch();
