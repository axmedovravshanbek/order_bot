const {Schema, model} = require('mongoose');

const User = new Schema({
    tgId: {type: String, required: true, unique: true},
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

const Addon = new Schema({
    name: {type: String, required: true, unique: true},
    count: {type: Number, required: true, default: 0},
});

module.exports = {
    User: model('User', User),
    Order: model('Order', Order),
    Meal: model('Meal', Meal),
    Addon: model('Addon', Addon),
}
