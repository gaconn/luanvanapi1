const { _buildSelect } = require("../utils/DBUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const DBConnection = require("./DBConnection")

class PermissionModel {
    constructor() {
        this.table = 'capdotaikhoan'
    }
    get = async (objCondition) => {
        try {
            var strSelect = "select 1"
            strSelect += _buildSelect(['*'], this.table)
    
            var strJoin = ''
            var strWhere = this._buildWhereQuery(objCondition)
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`
            const result = await DBConnection.query(query)
            
            if(!result || !result[0]) {
                throw new Error('Lỗi')
            }
            if(result[0].length === 0) {
                return ResponseUtil.response(false, 'Không tìm thấy dữ liệu')
            }
            return ResponseUtil.response(true, 'Thành công', result[0])
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    _buildWhereQuery = (objCondition) => {
        var strWhere = ' where 1=1 '
        if(objCondition.id) {
            strWhere += ` and ${this.table}.id = ${objCondition.id}`
        }

        if(objCondition.hasOwnProperty("TrangThai")) {
            strWhere += ` and ${this.table}.TrangThai = ${objCondition.TrangThai}`
        }

        return strWhere
    }
}

module.exports = new PermissionModel()