const {Schema, model} = require('mongoose');
const User = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    image: {type: String, default: 'https://schoolsw3.com/howto/img_avatar.png'},
    bill: {type: Number, default: 0},
    token: {type: String, default: ''},
    tgId: {type: String, default: ''}
});
const Order = new Schema({
    user: {type: String},
    order: {type: String},
    date: {type: String},
    // money: {type: Number},
    // members: [{}],
});
const Meal = new Schema({
    name: {type: String, required:true, unique: true},
    date: {type: String},
    todayTotal: {type: Number, default:0},
});
module.exports.User = model('User', User);
module.exports.Order = model('Order', Order);
module.exports.Meal = model('Meal', Meal);