require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const moment = require('moment');
const info = require('./src/info.json');

const API_TOKEN =
  process.env.NODE_ENV === 'production'
    ? process.env.BOT_TOKEN //production token - @veilicsDutyBot
    : process.env.TEST_BOT_TOKEN; //local  token - @VeicryptoBot

const bot = new Telegraf(API_TOKEN);

bot.command('start', ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  bot.telegram.sendMessage(
    ctx.chat.id,
    `歡迎 *${ctx.message.from.first_name}* 

請輸入想查詢之更份
如 129 / 525 / 881103 / 992701H 等

如遇問題請重新使用 \`/start\` 指令
`,
    {
      parse_mode: 'MarkdownV2',
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
      `您查詢的 ${dutyName} 更份資料如下

開工地點: ${info.location[dutyDetail.bookOnLocation]}
開工時間: ${moment(dutyDetail.bookOnTime, 'hh:mm a').format('HH:mm')}
收工時間: ${moment(dutyDetail.bookOffTime, 'hh:mm a').format('HH:mm')}
收工地點: ${info.location[dutyDetail.bookOffLocation]}
工時: ${moment(dutyDetail.duration, 'hh:mm').format('h:mm')}
備註: ${dutyDetail.remarks}

*點取以下文字以複製內容*

\`${dutyName}\n[${dutyDetail.bookOnLocation}]${moment(
        dutyDetail.bookOnTime,
        'hh:mm a'
      ).format('HH:mm')} - ${moment(dutyDetail.bookOffTime, 'HH:mm a').format(
        'HH:mm'
      )}[${dutyDetail.bookOffLocation}] ${moment(
        dutyDetail.duration,
        'hh:mm'
      ).format('h:mm')} <${dutyDetail.remarks}>\n\``,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  }
}

bot.hears(/^([a-z]\d{2})?([135][0-5][0-9])$/i, async ctx => {
  let kb = [[]];
  dutyNumber = ctx.match[0].toUpperCase();
  let duty;
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  await axios.get(process.env.DUTYFILE).then(response => {
    duty = response.data.duty;
    Object.keys(duty).forEach(x => {
      // let row = [];
      let button = {};
      if (x.match(/[a-z]\d{2}/gi)) {
        button.text = x;
        kb[0].push(button);
        //only for adding rows
        // kb.push(row);
      }
    });
    if (ctx.match[1]) {
      Object.keys(duty).includes(ctx.match[1].toUpperCase());
      ctx.deleteMessage();
      sendDuty(
        ctx.chat.id,
        ctx.match[0].toUpperCase(),
        duty[ctx.match[1].toUpperCase()][dutyNumber]
        // duty[ctx.match[1].toUpperCase()][ctx.match[0].toUpperCase()]
      );
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
        console.log(dutyRequired);
        ctx.deleteMessage();
        bot.telegram.sendChatAction(ctx.chat.id, 'typing');
        sendDuty(ctx.chat.id, ctx.match[0] + dutyNumber, dutyRequired);
        dutyNumber = '';
      });
    }
  });
});

bot.hears(/^[89]\d{5}[A-Z]?/i, async ctx => {
  bot.telegram.sendChatAction(ctx.chat.id, 'typing');
  const whichSpecialDuty = ctx.match[0].match(/^8.*/g) ? 'Training' : 'Special';
  bot.telegram.sendMessage(
    ctx.chat.id,
    `在${info.miscellenous[whichSpecialDuty]}更份中搜尋 ...`
  );

  await axios.get(process.env.DUTYFILE).then(response => {
    let dutyRequired =
      response.data.duty[whichSpecialDuty][ctx.match[0].toUpperCase()];
    ctx.deleteMessage();
    sendDuty(ctx.chat.id, ctx.match[0], dutyRequired);
  });
});

// bot.command('setduty', ctx => {
//   bot.telegram.sendMessage(
//     ctx.chat.id,
//     moment().day('Monday').isoWeek('1').toDate()
//   );

//   bot.on('message', async ctx => {
//     await ctx.message.text.split('\n').forEach(x => {
//       x.match(/^([a-z]\d{2})?([135][0-5][0-9])$/i)
//         ? bot.telegram.sendMessage(ctx.chat.id, `${x} Duty`)
//         : bot.telegram.sendMessage(ctx.chat.id, `${x} Not a duty`);
//     });
//   });
// });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch({});
