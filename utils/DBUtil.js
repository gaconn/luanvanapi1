const { checkIsObject } = require("./GeneralUtil")
const GeneralUtil = require("./GeneralUtil")
//thư viện bên php
class DBUtil {
    buildFieldQuery = (objData) => {//Mục đích gán biến value sql vd insert nhanvien (buildFieldQuery) value()
        if(checkIsObject === false) {
            return ""
        }
        if(Object.keys(objData).length === 0) return "" 
        const arrKeys = Object.keys(objData)
        if(!arrKeys) return ""
        const strKeys = arrKeys.join(", ")
        return strKeys
    }
    _buildSelect = (arrField, table, prefix ='') => {
        //arrField là field tên thuộc tính của table, table tên bảng dữ liệu,, prefix đổi tên thuộc tính
        var strSelect = ''
        for (let index = 0; index < arrField.length; index++) {
            strSelect += `, ${table}.${arrField[index]} ` 
            strSelect += prefix && arrField[index]!== '*' ? prefix + arrField[index] : ''
        }
        return strSelect
    }

    /**
     * Tạo ra mảng dữ liệu được sắp xếp đúng thứ tự của strField
     * @param {string} strField example: "id, name, old"
     * @returns array example: [1, 'quan', 18]
     */
    _buildInsertField = (strField, objField) => {//strField là kết quả buildFieldQuery, objField là objectdata 
        const arrField = strField.split(', ')

        var arrValue = []

        for(let i = 0; i<arrField.length ; i++) {
            arrValue.push(objField[arrField[i].trim()])
        }
        return arrValue
    }
    object_filter = (objData) => {
        //lọc undifine update 
         Object.keys(objData).forEach((key) => {
            if(objData[key] === undefined || objData[key] === null) {
                delete objData[key]
            }
        })
        return objData
    }
    
}

module.exports = new DBUtil()