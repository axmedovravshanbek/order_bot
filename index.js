require('dotenv').config()
const mongoose = require('mongoose');
const {Telegraf} = require('telegraf')
const {Order, Meal, User, Addon} = require('./models');
const cron = require('node-cron')

const bot = new Telegraf(process.env.BOT_TOKEN)

const isAdmin = (ctx) => {
    return ctx.update.message.from.id.toString() === process.env.DEV_ID.toString()
}
const sendMenu = async (ctx) => {
    const menu = await Meal.find()
    return ctx.telegram.sendPoll(
        process.env.GROUP_ID,
        'Ovqat tanlaymiz',
        menu.map(({name}) => name.split('_').join(' ')),
        {is_anonymous: false}
    )
}
const stopMenu = async (ctx) => {
    const today = new Date().toDateString()

    const allUsers = await User.find()
    const addons = await Addon.find({count: {$ne: 0}})
    const orderedUsers = [...await Order.find({date: today})].map(el => el.user)
    const didnt = allUsers.filter(el => !orderedUsers.includes(el.tgId))

    for (const user of didnt) {
        if (user.defaultMeal.length > 0) {
            await Order({
                date: today,
                order: user.defaultMeal,
                user: user.tgId
            }).save();
        }
    }
    const orders = await Order.aggregate([
        {
            $match: {"date": today}
        },
        {
            $group: {
                _id: "$order",
                name: {"$first": "$order"},
                count: {$sum: 1}
            }
        }
    ]);
    return ctx.telegram.sendMessage(
        process.env.GROUP_ID,
        // return ctx.replyWithHTML(
        'Assalom alaykum <a href="tg://user?id=' + process.env.COOK_ID + '">' + process.env.COOK_NAME + '</a>' +
        '\n\nBugunga\n\n' +
        [...orders, ...addons].map(({name, count}) =>
            `${name}: ${count} ta`).join('\n'),
        {parse_mode: "HTML"}
    )
}
const notifyUsers = async (ctx) => {
    const today = new Date().toDateString()
    const allUsers = await User.find()
    const orders = [...await Order.find({date: today})].map(el => el.user)
    const didnt = allUsers.filter(el => !orders.includes(el.tgId))

    if (didnt.length > 0)
        return ctx.telegram.sendMessage(
            process.env.GROUP_ID,
            // return ctx.replyWithHTML(
            `Ovqat tanlang, 15 minut qoldi\n\n${
                didnt.map(({tgId, name}) =>
                    `<a href="tg://user?id=${tgId}">${name}</a>`
                ).join('\n')
            }`,
            {parse_mode: "HTML"}
        )
}

bot.start((ctx) => {
    return ctx.telegram.sendMessage(
        process.env.DEV_ID,
        ctx.update.message.chat
    )
})
bot.on('poll_answer', async (ctx) => {
    const userId = ctx.update.poll_answer.user.id
    const user = await User.find({tgId: userId})
    if (!user) return

    const menu = await Meal.find()
    const today = new Date().toDateString()
    const ordered = await Order.findOne({date: today, user: userId});

    if (!ordered) {
        await Order({
            date: today,
            order: menu[ctx.update.poll_answer.option_ids[0]].name.split('_').join(' '),
            user: userId
        }).save();
    } else if (ctx.update.poll_answer.option_ids.length > 0) {
        await Order.updateOne({
            date: today,
            user: userId
        }, {order: menu[ctx.update.poll_answer.option_ids[0]].name.split('_').join(' ')})
    } else if (ctx.update.poll_answer.option_ids.length === 0) {
        await Order.deleteOne({date: today, user: userId});
    }
    /*  const x = await Order.find()
      return ctx.telegram.sendMessage('740160989',
          x.map(({user, order, date}) => `${user}, ${order}, ${date}`).join('\n'))*/
})
bot.command('menu', async (ctx) => {
    if (isAdmin(ctx)) {
        await sendMenu(ctx, false)
    } else ctx.reply('you can`t do it')
})
bot.command('stop', async (ctx) => {
    if (isAdmin(ctx)) {
        await stopMenu(ctx, false)
    } else ctx.reply('you can`t do it')
})
bot.command('notify', async (ctx) => {
    await notifyUsers(ctx, false)
})
bot.command('today', async (ctx) => {
    const today = new Date().toDateString()
    const x = await Order.find({date: today})
    return ctx.replyWithHTML(
        'today:\n\n' + x.map(({user, order}, i) =>
            `${i + 1}.  <a href="tg://user?id=${user}">${user}</a> - ${order}`).join('\n'))
})
bot.hears(/menga ([\w'-]+) (.+)/i, async (ctx) => {
    console.log(ctx.match)
    const userId = ctx.update.message.from.id
    const meal = ctx.match[2].toLowerCase().split('').map((ch, id) => !id ? ch.toUpperCase() : ch).join('')
    const menu = await Meal.find()

    if (ctx.match[1] !== 'default' && ctx.match[1] !== 'bugunga' && ctx.match[1] !== 'ertaga' && ctx.match[1] !== 'indinga') {
        return ctx.replyWithHTML('Tushunmadim')
    }
    if (menu.filter(el => el.name === meal).length === 0) {
        return ctx.replyWithHTML('Menyuda bunday ovqat mavjud emas')
    }
    if (ctx.match[1] === 'default') {
        await User.updateOne({tgId: userId}, {defaultMeal: meal});
        return ctx.replyWithHTML(`Yozib qo'ydim`)
    }

    let daysForward = 0
    if (ctx.match[1] === 'bugunga') daysForward = 0
    else if (ctx.match[1] === 'ertaga') daysForward = 1
    else if (ctx.match[1] === 'indinga') daysForward = 2
    const today = new Date()
    today.setDate(today.getDate() + daysForward)
    const date = new Date(today).toDateString()

    const user = await User.findOne({tgtId: userId});
    if (!user) return ctx.reply('you can`t')
    const didHeOrder = await Order.findOne({date, user: userId});
    if (!didHeOrder) {
        await Order({
            date,
            order: meal,
            user: userId
        }).save();
    } else {
        await Order.updateOne({date, user: userId}, {order: meal})
    }
    return ctx.replyWithHTML(`yozib qoydim`)
})
bot.hears(/non (-?\d+)/i, async (ctx) => {
    const count = ctx.match[1]
    if (count > 0 && count < 10) {
        const updated = await Addon.updateOne({name: 'Non'}, {count})
        console.log(updated)
        return ctx.reply(`Non ${count}ta bo'ldi`)
    }
})
bot.command('users', async (ctx) => {
    if (isAdmin(ctx)) {
        const users = await User.find()
        return ctx.reply(JSON.stringify(users, null, 2))
    } else ctx.reply('you can`t do it')
})
bot.hears(/start cron/i, async (ctx) => {
    if (isAdmin(ctx)) {
        cron.schedule('0 0 9 * * *', () => sendMenu(ctx, false))
        cron.schedule('0 30 10 * * *', () => notifyUsers(ctx))
        cron.schedule('0 45 10 * * *', () => stopMenu(ctx))
        return ctx.reply('ok')
    } else ctx.reply('you can`t do it')
})

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('database connected');
        await bot.launch().then(() => console.log('bot started'))
    } catch (e) {
        console.log(e)
    }
};
start();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

