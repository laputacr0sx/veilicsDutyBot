require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const API_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(API_TOKEN || '');
const PORT = process.env.PORT || 3333;
const dutyFile = process.env.DUTYFILE;
const URL = process.env.URL;
var dutyNumber;

bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);

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

function sendDuty(chatId, dutyName, dutyDetail) {
  if (!dutyDetail) {
    bot.telegram.sendChatAction(chatId, 'typing');
    bot.telegram.sendMessage(
      chatId,
      `未能找到您輸入的 ${dutyName} 更份或輸入錯誤，請重新搜尋`
    );
  } else {
    bot.telegram.sendMessage(
      chatId,
      `您查詢的${dutyName}更份資料如下
開工地點: ${dutyDetail.bookOnLocation}
開工時間: ${dutyDetail.bookOnTime}
收工時間: ${dutyDetail.bookOffTime}
收工地點: ${dutyDetail.bookOffLocation}
工時: ${dutyDetail.duration}
備註: ${dutyDetail.remarks}`
    );
  }
  dutyNumber = '';
}

bot.hears(/^([a-z]\d{2})?([135][0-5][0-9])/i, ctx => {
  let kb = [];
  dutyNumber = ctx.match[0];
  let duty;
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  axios.get(dutyFile).then(response => {
    duty = response.data.duty;
    Object.keys(duty).forEach(x => {
      let row = [];
      let button = {};
      if (x.match(/[a-z]\d{2}/gi)) {
        button.text = x;
        button.callback_data = x;
        row.push(button);
        kb.push(row);
      }
    });
    if (Object.keys(duty).includes(ctx.match[1])) {
      ctx.deleteMessage();
      sendDuty(ctx.chat.id, ctx.match[0], duty[ctx.match[1]][ctx.match[0]]);
    } else {
      ctx.deleteMessage();
      bot.telegram.sendMessage(
        ctx.chat.id,
        `請問是哪個更表的 ${dutyNumber} 更呢`,
        {
          reply_markup: {
            keyboard: kb,
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        }
      );
      bot.hears(/[a-z]\d{2}/i, ctx => {
        let dutyRequired = duty[ctx.match[0]][ctx.match[0] + dutyNumber];

        ctx.deleteMessage();
        sendDuty(ctx.chat.id, ctx.match[0] + dutyNumber, dutyRequired);
      });
    }
  });
});

bot.hears(/^[89]\d{5}[A-Z]?/, ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  const whichSpecialDuty = ctx.match[0].match(/^8.*/g) ? 'Training' : 'Special';
  bot.telegram.sendMessage(ctx.chat.id, `在${whichSpecialDuty}更份中搜尋 ...`);

  axios.get(dutyFile).then(response => {
    const dutyRequired = response.data.duty[whichSpecialDuty][ctx.match[0]];

    ctx.deleteMessage();

    sendDuty(ctx.chat.id, ctx.match[0], dutyRequired);
  });
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
