require('dotenv').config()
const mongoose = require('mongoose');
const {Telegraf, Markup} = require('telegraf')
const {groupBy} = require("./constants");
const {Order, Meal} = require('./models');
const cron = require('node-cron')
// const {notifyUsers, isAdmin} = require("./functions");
// bot.use(require('./composers/admin.composer'))

const bot = new Telegraf(process.env.BOT_TOKEN)

const sendMenu = async (ctx, edit = true) => {
    const menu = await Meal.find()
    const today = new Date().toDateString()
    const orders = await Order.aggregate([
        {
            $match: {"date": today}
        },
        {
            $group: {
                _id: "$order",
                name: {"$first": "$order"},
                todayTotal: {$sum: 1}
            }
        }
    ]);

    if (edit) {
        return ctx.editMessageText(
            `Bugunga hozircha \n${orders.map(({name, todayTotal}) => `${name}: ${todayTotal}ta\n`).join('')}`,
            groupBy(menu)
        )
    } else {
        return ctx.telegram.sendMessage(
            '-820585231',
            // return ctx.replyWithHTML(
            'summa',
            groupBy(menu)
        )
    }
}
const stopMenu = async (ctx, edit = true) => {
    // const menu = await Meal.find()
    const today = new Date().toDateString()
    const orders = await Order.aggregate([
        {
            $match: {"date": today}
        },
        {
            $group: {
                _id: "$order",
                name: {"$first": "$order"},
                todayTotal: {$sum: 1}
            }
        }
    ]);

    // return ctx.editMessageText(
    //     groupBy(menu, ctx.session.selected)
    // )
    // return ctx.telegram.sendMessage(
    //     '-820585231',
    return ctx.replyWithHTML(
        `Assalom alaykum <a href="tg://user?id=${process.env.DEV_ID}">Dilshod aka</a> \n
Bugunga \n${orders.map(({name, todayTotal}) => `${name}: ${todayTotal}ta\n`).join('')}`
    )
}

// bot.start((ctx) => {
//     return ctx.replyWithHTML(
//         "ℹ️ tizimga kirish uchun <b>login ISM PAROL</b> ko'rinishida yozing\n" +
//         "ℹ️ ma'lumot kiritish <b>add SUMMA SABAB</b> ko'rinishida yozing",
//         Markup.keyboard(
//             ['📃 Xarajatlar', '🙎‍♂️ Men', '👨‍👨‍👦‍👦 Foydalanuvchilar', '📤 Chiqish'],
//             {columns: 2}
//         ).resize())
// })
// bot.command('list', ctx => {
//     console.log(ctx)
// })

/*

bot.hears(/add (-?\d+) (.+)/, async (ctx) => {
    if (ctx.session.myId) {
        const users = await User.find();
        ctx.db.users = users
        ctx.session = {
            ...ctx.session,
            bill: parseInt(ctx.match[1]),
            reason: ctx.match[2],
            selected: [],
        }
        return ctx.replyWithHTML(
            `summa: <b>${ctx.session.bill}</b>\nsabab: <b>${ctx.session.reason}</b>`,
            groupBy(users, ctx.session.selected)
        )
    } else {
        return ctx.replyWithHTML(notRegisteredText)
    }
})

bot.action('selectAll', async (ctx) => {
    if (ctx.session.selected.length === ctx.db.users.length) {
        ctx.session.selected = []
    } else ctx.session.selected = ctx.db.users.map(({username}) => username)
    ctx.editMessageText(
        `summa: ${ctx.session.bill}\nsabab: ${ctx.session.reason}`,
        groupBy(ctx.db.users, (ctx.session.selected.length === ctx.db.users ? [] : ctx.session.selected))
    )
    return ctx.answerCbQuery()
})
bot.action(/editPage (-?\d)/, async (ctx) => {
    if (ctx.session.myId) {
        if (ctx.db.bills.length > 0) {
            ctx.session.page += parseInt(ctx.match[1]);

            await ctx.editMessageText(
                billsPrettier(ctx.db.bills, ctx.session.page, isAdmin(ctx)),
                billsButtons(ctx.db.bills, ctx.session.page)
            )
            return ctx.answerCbQuery()
        } else {
            const bills = await Bill.find()
            const page = Math.ceil(bills.length / 10)
            ctx.db.bills = bills
            ctx.session.page = page
            ctx.reply(
                billsPrettier(bills, page, isAdmin(ctx)),
                billsButtons(bills, page)
            )
        }
    } else {
        ctx.deleteMessage()
        return ctx.answerCbQuery(notRegisteredText, {show_alert: true})
    }
})
bot.action('addBill', async (ctx) => {
    if (ctx.session.myId) {
        let {selected, reason, bill} = ctx.session
        const user = await User.findById(ctx.session.myId)
        console.log(user)
        if (selected.length === 0) {
            return ctx.answerCbQuery('Foydalanuvchilarni tanlang', {show_alert: true})
        }
        if (selected.length === 1 && selected.includes(user.username)) {
            return ctx.answerCbQuery('jillimisan ya', {show_alert: true})
        }
        await User.bulkWrite([
            {
                updateMany: {
                    filter: {username: {$in: selected}},
                    update: {$inc: {bill: Math.floor(parseInt(bill) / selected.length)}}
                }
            },
            {
                updateOne: {
                    filter: {_id: user._id.toString()},
                    update: {$inc: {bill: -parseInt(bill)}}
                }
            },
        ]);
        const newBill = await Bill({
            user: user.username,
            money: parseInt(bill),
            date: new Date().toDateString(),
            members: selected,
            reason
        }).save();
        await notifyUsers(selected, newBill)
        ctx.session = {
            ...ctx.session,
            selected: [],
            reason: '',
            bill: 0,
        }
        for (const el of ctx.db.users) {
            if (selected?.includes(el.username) && el.tgId.length > 1) {
                await bot.telegram.sendMessage(
                    el.tgId,
                    `${user.username} ${reason}ga ${bill} so'm ishlatdi. ${selected.length} odamga, Sanga (${el.username}) ${Math.floor(bill / selected.length)} so'm yozildi`);
            }
        }
        ctx.deleteMessage()
        return ctx.answerCbQuery('Ma\'lumotlar tizimga kiritildi', {show_alert: true})
    } else {
        ctx.deleteMessage()
        return ctx.answerCbQuery(notRegisteredText, {show_alert: true})
    }
})*/
bot.command('menu', async (ctx) => {
    // console.log('user ', ctx.update.message.from.id)
    // console.log(ctx.update.message.chat)
    await sendMenu(ctx, false)
})
bot.hears('stop_menu', async (ctx) => {
    await stopMenu(ctx, false)
})

bot.action(/toggle ([\w'-]+)/, async (ctx) => {
    const userId = ctx.update.callback_query.from.id
    const today = new Date().toDateString()
    const didHeOrder = await Order.findOne({date: today, user: userId});
    if (!didHeOrder) {
        await Order({
            date: today,
            order: ctx.match[1],
            user: userId
        }).save();
    } else {
        await Order.updateOne({date: today, user: userId}, {order: ctx.match[1]})
    }
    await sendMenu(ctx)
    return ctx.answerCbQuery()
})
bot.hears(/Menga ([\w'-]+) ([\w'-]+)/, async (ctx) => {
        const userId = ctx.update.message.from.id
        const meal = ctx.match[2]
        const menu = await Meal.find()

        if (ctx.match[1] !== 'default' && ctx.match[1] !== 'bugunga' && ctx.match[1] !== 'ertaga' && ctx.match[1] !== 'indinga') {
            return ctx.replyWithHTML('Tushunmadim')
        }
        if (menu.filter(el => el.name === meal).length === 0) {
            return ctx.replyWithHTML('bunday ovqat yoqqo')
        }
        // if (ctx.match[1] == 'default') {
            // await User.up
        // }
        let daysForward = 0
        if (ctx.match[1] === 'bugunga') daysForward = 0
        else if (ctx.match[1] === 'ertaga') daysForward = 1
        else if (ctx.match[1] === 'indinga') daysForward = 2

        const today = new Date()
        today.setDate(today.getDate() + daysForward)
        const date = new Date(today).toDateString()
        console.log(date, meal)
        const didHeOrder = await Order.findOne({date: today, user: userId});
        if (!didHeOrder) {
            await Order({
                date: today,
                order: ctx.match[1],
                user: userId
            }).save();
        } else {
            await Order.updateOne({date: today, user: userId}, {order: ctx.match[1]})
        }
        ctx.replyWithHTML(`yozib qoydim`)
    }
)

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