const {Markup} = require("telegraf");

const groupBy = (arr) => {
    const n = arr.length % 3 === 1 ? 4 : 3
    const x = arr.map(({name, todayTotal}) =>
        Markup.button.callback(
            `${name} ${todayTotal!==0?`(${todayTotal})`:``}`,
            `toggle ${name}`
        )
    )
    return Markup.inlineKeyboard([
        // [Markup.button.callback(`Hamma`, 'selectAll')],
        ...x.reduce((r, e, i) =>
                (i % n ? r[r.length - 1].push(e) : r.push([e])) && r
            , []),
        // [Markup.button.callback('Qo\'shish', 'addBill')]
    ])
}

// module.exports.billsPrettier = billsPrettier
// module.exports.billsButtons = billsButtons
module.exports.groupBy = groupBy
/*
const billsPrettier = (bills, page, isAdmin = false) => {
    const x = bills.length - (Math.ceil(bills.length / 10) - page) * 10
    return bills
        .map(({_doc}, id) => ({..._doc, nId: id + 1}))
        .filter((el, id) => id < x && id >= x - 10)
        .map((item) => {
            const date = new Date(item.date);
            const {user, reason, money, members, nId} = item;
            return `${isAdmin ? `🆔 <b>${item._id}</b>\n` : ''}📃 №<b>${nId}</b>\n🙎‍♂ <b>${user}</b>\n📅 <b>${date.getDate()}-${months[date.getMonth() - 1]}</b>da\n🍏 <b>${reason}</b> uchun\n💴 <b>${money}</b> so'm ishlatgan.\n👨‍👨‍👦‍👦 <b>${members.join(', ')}</b>lar bo'lgan.`
        })
        .join(`\n\n`)
}


const billsButtons = (bills, page) => {
    return {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
            Markup.button.callback('⬅', `editPage -1`, page <= 1),
            Markup.button.callback('➡', `editPage 1`, page >= Math.ceil(bills.length / 10))
        ])
    }

}
*/
// const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
