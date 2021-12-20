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

function sendDuty(chatId, dutyName, dutyDetail) {
  console.log(dutyDetail);
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
}

bot.hears(/^[135][0-5][0-9]/, ctx => {
  let kb = [];
  let dutyNumber = ctx.match[0];
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
  });
  bot.hears(/[a-z]\d{2}/i, ctx => {
    let dutyRequired = duty[ctx.match[0]][ctx.match[0].concat(dutyNumber)];

    ctx.deleteMessage();
    sendDuty(ctx.chat.id, [ctx.match[0].concat(dutyNumber)], dutyRequired);
  });
});

bot.hears(/^[89]\d{5}[A-Z]?/, ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  const whichSpecialDuty = ctx.match[0].match(/^8.*/g) ? 'Training' : 'Special';
  bot.telegram.sendMessage(ctx.chat.id, `在${whichSpecialDuty}更份中搜尋 ...`);

  axios.get(dutyFile).then(response => {
    const dutyRequired = response.data.duty[whichSpecialDuty][ctx.match[0]];

    ctx.deleteMessage();

    //     if (!dutyRequired) {
    //       bot.telegram.sendChatAction(ctx.chat.id, 'typing');
    //       ctx.deleteMessage();
    //       bot.telegram.sendMessage(
    //         ctx.chat.id,
    //         `Sorry I cannot find your duty ${ctx.match[0]}`
    //       );
    //     } else {
    //       ctx.deleteMessage();
    //       bot.telegram.sendMessage(
    //         ctx.chat.id,
    //         `您查詢的${ctx.match[0]}更份資料如下
    // 開工地點:${dutyRequired.bookOnLocation}
    // 開工時間: ${dutyRequired.bookOnTime}
    // 收工時間: ${dutyRequired.bookOffTime}
    // 收工地點: ${dutyRequired.bookOffLocation}
    // 工時: ${dutyRequired.duration}
    // 備註: ${dutyRequired.remarks}`,
    //         {
    //           reply_markup: {
    //             inline_keyboard: [[{ text: 'Return', callback_data: 'return' }]],
    //           },
    //           resize_keyboard: true,
    //         }
    //       );
    //     }
    sendDuty(ctx.chat.id, ctx.match[0], dutyRequired);
  });
});

bot.launch();
