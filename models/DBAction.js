const DBUtil = require("../utils/DBUtil")
const GeneralUtil = require("../utils/GeneralUtil")
const DBConnection = require("./DBConnection")
class DBAction {
    constructor(tableName) {
        this.tableName = tableName 
    }
    buildSelectQueryAction = (arrCondition = {}, arrColumn= []) => {
        var query = ""
        query = DBUtil.select(this.tableName, arrColumn)
        query += DBUtil.where(this.tableName, arrCondition)
    }
}

module.exports = DBAction