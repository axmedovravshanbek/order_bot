const {Composer} = require('telegraf')
const {Bill, Meal} = require("../models");
const cron = require('node-cron')

const composer = new Composer()

const isAdmin = (ctx) => {
    return ctx.update.message.from.id.toString() === process.env.DEV_ID.toString()
}

composer.hears(/delete (\w+)/, async (ctx) => {
    if (isAdmin(ctx)) {
        // await Bill.findByIdAndDelete(ctx.match[1])
        // ctx.db.bills = ctx.db.bills.filter(el => el._id !== ctx.match[1])
        return ctx.reply('deleted')
    } else ctx.reply('you can`t do it')
})

composer.hears(/addmeal ([\w'-]+)/, async (ctx) => {
    if (isAdmin(ctx)) {
        const newMeal = await Meal({name: ctx.match[1]}).save()
        return ctx.replyWithHTML(newMeal)
    } else ctx.reply('you can`t do it')
})

module.exports = composer