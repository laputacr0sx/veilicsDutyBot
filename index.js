require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const API_TOKEN =
  process.env.NODE_ENV === 'production'
    ? process.env.BOT_TOKEN
    : process.env.TEST_BOT_TOKEN;

const bot = new Telegraf(API_TOKEN);
const dutyFile = process.env.DUTYFILE;
// var dutyNumber;

bot.command('start', ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  bot.telegram.sendMessage(
    ctx.chat.id,
    `歡迎 ${ctx.message.from.first_name} ${ctx.message.from.last_name}
請輸入想查詢之更份
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
備註: ${dutyDetail.remarks}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: `複製 ${dutyName} 資料`, callback_data: 'copy' }],
          ],
        },
      }
    );
  }
}

bot.hears(/^([a-z]\d{2})?([135][0-5][0-9])/i, async ctx => {
  let kb = [];
  dutyNumber = ctx.match[0];
  let duty;
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  await axios.get(dutyFile).then(response => {
    duty = response.data.duty;
    Object.keys(duty).forEach(x => {
      let row = [];
      let button = {};
      if (x.match(/[a-z]\d{2}/gi)) {
        button.text = x;
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
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        sendDuty(ctx.chat.id, ctx.match[0] + dutyNumber, dutyRequired);
        dutyNumber = '';
      });
    }
  });
});

bot.hears(/^[89]\d{5}[A-Z]?/, async ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  const whichSpecialDuty = ctx.match[0].match(/^8.*/g) ? 'Training' : 'Special';
  bot.telegram.sendMessage(ctx.chat.id, `在${whichSpecialDuty}更份中搜尋 ...`);

  await axios.get(dutyFile).then(response => {
    const dutyRequired = response.data.duty[whichSpecialDuty][ctx.match[0]];

    ctx.deleteMessage();

    sendDuty(ctx.chat.id, ctx.match[0], dutyRequired);
  });
});

bot.action('copy', ctx => {
  ctx.answerCbQuery((text = '個掣未有用架喂'));
  ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [[]] } });
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
