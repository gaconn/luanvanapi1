const DBUtil = require('../utils/DBUtil')
const { buildFieldQuery } = require('../utils/DBUtil')
const GeneralUtil = require('../utils/GeneralUtil')
const { checkIsEmptyObject } = require('../utils/GeneralUtil')
const ResponseUtil = require('../utils/ResponseUtil')
const DBConnection = require('./DBConnection')
const dbconnect= require('./DBConnection')
class SupplierModel {
    constructor() {
        this.table = "nhacungcap"
    }
    get = async(objCondition) => {
        if(!objCondition || !objCondition.page) {
            objCondition = {...objCondition, page: 1}
        }
        if(objCondition.page< 1) {
            return ResponseUtil.response(false, "Trang không hợp lệ")
        }
        var start= (objCondition.page-1)*10
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            const query = `select * from ${this.table}\
            , (select COUNT(sp.id) SoLuongSanPham  from sanpham sp join ${this.table} ncc on sp.idnhacungcap = ncc.id) as SoLuongSanPham ${strWhere} limit 10 offset ${start}`
            const arrData = await dbconnect.query(query)

            const queryCount = `select COUNT(nhacungcap.id) as rowCount from nhacungcap ${strWhere}`
            const arrCount = await dbconnect.query(queryCount)

            if(!arrData || !arrCount) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if(!arrData[0] || !arrCount[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }

            return ResponseUtil.response(true, 'Thành công', {data: arrData[0], rowCount: arrCount[0][0].rowCount})
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    insert = async(objSupplier) => {
        var error = []
        if(objSupplier.Ten === "") {
            error.push('Tên nhà cung cấp không được để trống')
        }
        if(error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {
            const objField = {
                Ten: objSupplier.Ten,
                TrangThai: 1,
                DaXoa: 0,
                ThoiGianTao: new Date().getTime()/1000,
            }

            const strField = buildFieldQuery(objField)
            if(strField === "" || !strField ) {
                throw new Error('build query thất bại')
            } 

            const arrField = strField.split(', ')

            var arrValue = []

            for(let i = 0; i<arrField.length ; i++) {
                arrValue.push(objField[arrField[i].trim()])
            }
            const query = `insert into nhacungcap(${strField}) values(?)`
            const dataResponse = await dbconnect.query(query, [arrValue])

            if(!dataResponse || !dataResponse[0]) {
                return ResponseUtil.response(false, 'Không thể truy xuất database', [] , ['Không thể truy xuất database'])
            }
            if(dataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại', [], 'Dữ liệu không hợp lệ')
            }
            return ResponseUtil.response(true, 'Thành công' )
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    update = async(objDataUpdate, objCondition) => {
        const error = []
        if(checkIsEmptyObject(objDataUpdate)) {
            error.push('Dữ liệu cần sửa không hợp lệ')
        }
        if(checkIsEmptyObject(objCondition)) {
            error.push('Thiếu điều kiện cập nhật')
        }

        try {
            objDataUpdate.ThoiGianCapNhat = new Date().getTime() /1000
            const query = `update nhacungcap set ? where ?`

            const arrDataResponse = await dbconnect.query(query, [objDataUpdate, objCondition])

            if(!arrDataResponse || !arrDataResponse[0]) {
                return ResponseUtil.response(false, 'Truy xuất database không thành công', [], ['Có lỗi xảy ra khi truy xuất database'])
            }
            if(arrDataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại')
            }
            return ResponseUtil.response(true, 'Sửa dữ liệu nhà cung cấp thành công')
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    delete = async(objCondition) => {
        const error = []
       
        if(checkIsEmptyObject(objCondition)) {
            error.push('Thiếu điều kiện xóa')
        }

        try {
            const query = `delete from nhacungcap where ?`

            const arrDataResponse = await dbconnect.query(query, objCondition)

            if(!arrDataResponse || !arrDataResponse[0]) {
                return ResponseUtil.response(false, 'Truy xuất database không thành công', [], ['Có lỗi xảy ra khi truy xuất database'])
            }
            if(arrDataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại')
            }
            return ResponseUtil.response(true, 'Xóa dữ liệu nhà cung cấp thành công')
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    _buildWhereQuery = (objCondition) => {
        var strWhere = "where 1=1 "
        if(GeneralUtil.checkIsEmptyObject(objCondition)) {
            return strWhere
        }
        
        if(objCondition.hasOwnProperty('id') && objCondition.id) {
            strWhere += `and id = ${objCondition.id}`
        }

        if(objCondition.hasOwnProperty('Ten') && objCondition.Ten) {
            strWhere += `and Ten = ${objCondition.Ten}`
        }

        if(objCondition.hasOwnProperty('DaXoa')) {
            strWhere += ` and DaXoa = ${objCondition.DaXoa}`
        }

        if(objCondition.hasOwnProperty('HoatDong') ) {
            strWhere += ` and HoatDong = ${objCondition.HoatDong}`
        }

        if(objCondition.hasOwnProperty('TrangThai') ) {
            strWhere += ` and TrangThai = ${objCondition.TrangThai}`
        }
        if(objCondition.hasOwnProperty('ThoiGianTao')) {
            strWhere += `and ThoiGianTao > ${objCondition.ThoiGianTao}`
        }

        return strWhere
    }

    getDetail = async(objCondition) => {
        if(!objCondition) {
            return ResponseUtil.response(false, "Tham số không hợp lệ")
        }
        try {
            objCondition  = DBUtil.object_filter(objCondition)
            const strWhere = this._buildWhereQuery(objCondition)
            const query = `select * from nhacungcap ${strWhere}`

            const dataResponse = await DBConnection.query(query)
            if(!dataResponse || !dataResponse[0]) {
                throw new Error("Không thể thao tác database")
            }

            return ResponseUtil.response(true, "Thành công", dataResponse[0])
        } catch (error) {
            return ResponseUtil.response(false, "Lỗi hệ thống")
        }
    }

}

module.exports = new SupplierModel()