'use strict';

const { Sequelize } = require('sequelize');
const config = require('../../../config/database');
const _ = require('lodash');

class Database {
    constructor () {
        this.sequelize = new Sequelize(config.database, config.username, config.password, {
            host: config.host,
            port: config.port,
            dialect: 'mysql',
        });

        this.init();
    }

    async init () {
        await this.sequelize.authenticate();
        console.log('Connection has been established successfully.');
    }

    async sync () {
        await this.sequelize.sync();
        console.log('Database synced');
    }

    async defineModel (modelName, attributes) {
        const model = this.sequelize.define(modelName, attributes);
        await model.sync();
        console.log(`Model ${modelName} defined`);
    }

    async defineModels (models) {
        _.forEach(models, (attributes, modelName) => {
            this.defineModel(modelName, attributes);
        });
    }

    async saveData (modelName, data) {
        const model = this.sequelize.models[modelName];
        await model.bulkCreate(data);
        console.log(`Data saved in ${modelName}`);
    }
}

module.exports = Database;

// const sequelize = new Sequelize("airportsDB","root", "airports", {
//     host: "localhost",
//     port: 3307,
//     dialect: "mysql",
// });

// async function test() {
//     try {
//         await sequelize.authenticate();
//         console.log('Connection has been established successfully.');
//       } catch (error) {
//         console.error('Unable to connect to the database:', error);
//       }
// }

// test();
