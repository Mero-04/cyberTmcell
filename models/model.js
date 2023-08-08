const { DataTypes } = require('sequelize');
const sequelize = require("../data/db");

const Admin = sequelize.define("admin", {
    id: {
        type: DataTypes.INTEGER(10),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "User", allowNull: false },
});


const Datacyber = sequelize.define("datacyber", {
    id: {
        type: DataTypes.INTEGER(10),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },  
    months: { type: DataTypes.STRING, allowNull: false },
    month_name: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: false }
});


const DataWeek = sequelize.define("dataweek", {
    id: {
        type: DataTypes.INTEGER(10),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },  
    week: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = {
    Admin,
    Datacyber,
    DataWeek
};
