const {Schema, model} = require('mongoose');

const User = new Schema({
    tgId: {type: String, required: true, unique:true},
    name: {type: String, unique: true, required: true},
    defaultMeal: {type: String, default: ''},
});
const Order = new Schema({
    user: {type: String},
    order: {type: String},
    date: {type: String},
});
const Meal = new Schema({
    name: {type: String, required: true, unique: true},
});

module.exports.User = model('User', User);
module.exports.Order = model('Order', Order);
module.exports.Meal = model('Meal', Meal);