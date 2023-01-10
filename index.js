require('dotenv').config()
const mongoose = require('mongoose');
const {Telegraf} = require('telegraf')
const {Order, Meal, User, Addon} = require('./models');
const cron = require('node-cron')
const duties = require('./duties.json')

const bot = new Telegraf(process.env.BOT_TOKEN)

cron.schedule('0 0 9 * * 1-5', () => sendMenu())
cron.schedule('0 30 10 * * 1-5', () => notifyUsers())
cron.schedule('0 45 10 * * 1-5', () => stopMenu())

const isAdmin = (ctx) => {
    return ctx.update.message.from.id.toString() === process.env.DEV_ID.toString()
}

const getDuties = () => {
    const startDate = new Date('January 2, 2022')
    const endDate = new Date()
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return duties[count % 6]
}
const sendMenu = async () => {
    const menu = await Meal.find()
    return bot.telegram.sendPoll(
        process.env.GROUP_ID,
        'Ovqat tanlaymiz',
        menu.map(({name}) => name.split('_').join(' ')),
        {is_anonymous: false}
    )
}
const stopMenu = async () => {
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
            $match: {$and: [{"date": today}, {order: {$ne: 'nothing'}}]}
        },
        {
            $group: {
                _id: "$order",
                name: {"$first": "$order"},
                count: {$sum: 1}
            }
        }
    ]);
    await bot.telegram.sendMessage(
        process.env.GROUP_ID,
        'Assalom alaykum <a href="tg://user?id=' + process.env.COOK_ID + '">' + process.env.COOK_NAME + '</a>' +
        '\n\nBugunga\n\n' +
        [...orders, ...addons].map(({name, count}) =>
            `${name}: ${count} ta`).join('\n'),
        {parse_mode: "HTML"}
    )
    return bot.telegram.sendMessage(
        process.env.GROUP_ID,
        `${getDuties().map(({name, tgId}) => `<a href="tg://user?id=${tgId}">${name}</a>`).join(', ')}\nSizlar navbatchisizlar`,
        {parse_mode: "HTML"}
    )

}
const notifyUsers = async () => {
    const today = new Date().toDateString()
    const allUsers = await User.find()
    const orders = [...await Order.find({date: today})].map(el => el.user)
    const didnt = allUsers.filter(el => !orders.includes(el.tgId))

    if (didnt.length > 0)
        return bot.telegram.sendMessage(
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
    try {
        const userId = ctx.update.poll_answer.user.id
        const user = await User.findOne({tgId: userId})
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
        } else if (ordered.order === 'nothing') {
            return console.log(user.name + ' attempts to eat');
        } else if (ctx.update.poll_answer.option_ids.length > 0) {
            await Order.updateOne({
                date: today,
                user: userId
            }, {order: menu[ctx.update.poll_answer.option_ids[0]].name.split('_').join(' ')})
        } else if (ctx.update.poll_answer.option_ids.length === 0) {
            await Order.deleteOne({date: today, user: userId});
        }
    } catch (e) {
        console.log(e)
    }
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
    let arg = [
        {
            $match: {date: today}
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: 'tgId',
                as: 'userInfo'
            }
        },
        {$unwind: '$userInfo'},
        {
            $project: {
                order: 1,
                date: 1,
                userName: '$userInfo.name',
                userTgId: '$userInfo.tgId',
                userDefaultMeal: '$userInfo.defaultMeal',
            }
        }
    ]
    const x = await Order.aggregate(arg)
    return ctx.replyWithHTML(`<pre>${x.map(({userName, userDefaultMeal, order}, i) => (
        `${String(i + 1).padEnd(2, ' ')} | ${userName.padEnd(15, ' ')} | ${(order === 'nothing' ? '❌' : order).padEnd(15, ' ')}`
    )).join('\n')}</pre>`)
})
bot.command('duty', async (ctx) => {
    if (isAdmin(ctx)) {
        return ctx.replyWithHTML(
            `${getDuties().map(({name, tgId}) => `<a href="tg://user?id=${tgId}">${name}</a>`).join(', ')}\nSizlar navbatchisizlar`
        )
    } else ctx.reply('you can`t do it')
})
bot.command('users', async (ctx) => {
    if (isAdmin(ctx)) {
        const users = await User.find()
        return ctx.replyWithHTML(`<pre>${users.map(({name, tgId, defaultMeal}, i) => (
            `${String(i + 1).padEnd(2, ' ')} | ${name.padEnd(15, ' ')}|${tgId.padEnd(15, ' ')} | ${defaultMeal.padEnd(15, ' ')}`
        )).join('\n')}</pre>`)
    } else ctx.reply('you can`t do it')
})

bot.hears(/menga ([\w'-]+) (.+)/i, async (ctx) => {
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
bot.hears(/(.+) bugun yemaydi/i, async (ctx) => {
    const user = await User.findOne({name: ctx.match[1]});
    if (!user) return ctx.replyWithHTML('Tushunmadim, kim?')

    const ordered = await Order.findOne({date: new Date().toDateString(), user: user.tgId});

    if (!ordered) {
        await Order({
            date: new Date().toDateString(),
            order: 'nothing',
            user: user.tgId
        }).save();
    } else {
        await Order.updateOne({
            date: new Date().toDateString(),
            user: user.tgId
        }, {order: 'nothing'})
    }
    return ctx.replyWithHTML(`yozib qoydim`)
})
bot.hears(/bugun (.+) (-?\d+)/i, async (ctx) => {
    const addon = ctx.match[1].toLowerCase().split('').map((ch, id) => !id ? ch.toUpperCase() : ch).join('')
    const count = ctx.match[2]
    if (count >= 0 && count < 10) {
        const x = await Addon.updateOne({name: addon}, {count})
        return ctx.reply(x.matchedCount?`${addon} ${count}ta bo'ldi`:'tushunmadim')
    }
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
start()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
