const DBUtil = require('../utils/DBUtil')
const { buildFieldQuery, _buildSelect } = require('../utils/DBUtil')
const GeneralUtil = require('../utils/GeneralUtil')
const { checkIsEmptyObject } = require('../utils/GeneralUtil')
const ResponseUtil = require('../utils/ResponseUtil')
const DBConnection = require('./DBConnection')
const dbconnect = require('./DBConnection')
class CategoryModel {
    constructor() {
        this.table = "theloai"
    }
    get = async (objCondition) => {
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ''
            if(objCondition.joinChild) {
                strJoin = ` left join theloai tl2 on ${this.table}.id = tl2.IDTheLoaiCha`
                strSelect += _buildSelect(['id'], 'tl2', 'children_')
            }
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`
            const arrData = await dbconnect.query(query)
            var arrCount = null;
            if (objCondition.rowCount) {
                const queryCount = `select COUNT(theloai.id) as rowCount from theloai ${strWhere}`
                arrCount = await dbconnect.query(queryCount)

                if (!arrCount) {
                    return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
                }
                if (!arrCount[0]) {
                    return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
                }
            }

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }
            return ResponseUtil.response(true, 'Thành công', { data: arrData[0] })
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    insert = async (objCategory) => {
        var error = []
        if (objCategory.Ten === "") {
            error.push('Tên thể loại không được để trống')
        }
        if (error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {
            const objCheckField = {
                Ten: objCategory.Ten,
                DaXoa: 0
            }

            const strCheckField = this._buildWhereQuery(objCheckField)
            const queryCheck = `select id from ${this.table} ${strCheckField} limit 1`
            const dataExist = await dbconnect.query(queryCheck)
            if (dataExist && dataExist[0] && dataExist[0].length > 0) {
                return ResponseUtil.response(false, `"${objCategory.Ten}" đã tồn tại`)
            }

            const objField = {
                Ten: objCategory.Ten,
                MoTa: objCategory.MoTa,
                DaXoa: 0,
                HoatDong: 1,
                ThoiGianTao: new Date().getTime() / 1000,
                IDTheLoaiCha: objCategory.IDTheLoaiCha
            }

            const strField = buildFieldQuery(objField)
            if (strField === "" || !strField) {
                throw new Error('build query thất bại')
            }

            const arrField = strField.split(', ')

            var arrValue = []

            for (let i = 0; i < arrField.length; i++) {
                arrValue.push(objField[arrField[i].trim()])
            }
            const query = `insert into theloai(${strField}) values(?)`
            const dataResponse = await dbconnect.query(query, [arrValue])

            if (!dataResponse || !dataResponse[0]) {
                return ResponseUtil.response(false, 'Không thể truy xuất database', [], ['Không thể truy xuất database'])
            }
            if (dataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại', [], 'Dữ liệu không hợp lệ')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    update = async (objDataUpdate, objCondition) => {
        const error = []
        if (checkIsEmptyObject(objDataUpdate)) {
            error.push('Dữ liệu cần sửa không hợp lệ')
        }
        if (checkIsEmptyObject(objCondition)) {
            error.push('Thiếu điều kiện cập nhật')
        }
        if (objDataUpdate.Ten && objDataUpdate.Ten === '') {
            error.push('Tên ngành hàng không được để trống')
        }

        if (error.length > 0) {
            return ResponseUtil.response(false, "Dữ liệu truyền vào không hợp lệ", [], error)
        }
        try {
            var dataUpdate = {
                HoatDong: objDataUpdate.HoatDong ? objDataUpdate.HoatDong : undefined,
                MoTa: objDataUpdate.MoTa ? objDataUpdate.MoTa : undefined,
                Ten: objDataUpdate.Ten ? objDataUpdate : undefined,
                ThoiGianCapNhat: new Date().getTime() / 1000,
                DaXoa: objDataUpdate.DaXoa ? objDataUpdate.DaXoa : undefined
            }

            dataUpdate = DBUtil.object_filter(dataUpdate)

            const query = `update theloai set ? where ?`

            const arrDataResponse = await dbconnect.query(query, [dataUpdate, objCondition])

            if (!arrDataResponse || !arrDataResponse[0]) {
                return ResponseUtil.response(false, 'Truy xuất database không thành công', [], ['Có lỗi xảy ra khi truy xuất database'])
            }
            if (arrDataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại')
            }
            return ResponseUtil.response(true, 'Sửa dữ liệu nhà cung cấp thành công')
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    delete = async (objCondition) => {
        const error = []

        if (checkIsEmptyObject(objCondition)) {
            error.push('Thiếu điều kiện xóa')
        }

        try {

            const queryCheckExist = `select theloai.id from theloai join sanpham on theloai.id = sanpham.IDTheLoai where theloai.id = ?`
            const arrDataCheckResponse = await dbconnect.query(queryCheckExist, objCondition.id)
            if (arrDataCheckResponse && arrDataCheckResponse[0] && arrDataCheckResponse[0].length > 0) {
                return ResponseUtil.response(false, 'Ngành hàng có chứa sản phẩm trong kho, không thể xóa.')
            }

            //kiểm tra đã có ngành hàng con hay chưa
            const dataCheckSubCategory = await this.get({id: objCondition.id, child:true})
            if(dataCheckSubCategory && dataCheckSubCategory.success && dataCheckSubCategory.data.length > 0) {
                return ResponseUtil.response(false, 'Ngành hàng có chứa ngành hàng con, không thể xóa. ')
            }
            const query = `update theloai set DaXoa = 1 where ?`

            const arrDataResponse = await dbconnect.query(query, [objCondition])

            if (!arrDataResponse || !arrDataResponse[0]) {
                return ResponseUtil.response(false, 'Truy xuất database không thành công', [], ['Có lỗi xảy ra khi truy xuất database'])
            }
            if (arrDataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại. Không thể xóa ngành hàng này !')
            }
            return ResponseUtil.response(true, 'Xóa dữ liệu ngành hàng thành công')
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error.message])
        }
    }

    _buildWhereQuery = (objCondition) => {
        var strWhere = "where 1=1 "
        if (GeneralUtil.checkIsEmptyObject(objCondition)) {
            return strWhere
        }

        if (objCondition.hasOwnProperty('id') && objCondition.id) {
            if (objCondition.child) {
                strWhere += ` and ${this.table}.IDTheLoaiCha = ${objCondition.id}`
            } else {
                strWhere += ` and ${this.table}.id = ${objCondition.id}`
            }
        }

        if (objCondition.hasOwnProperty('Ten') && objCondition.Ten) {
            strWhere += ` and ${this.table}.Ten = '${objCondition.Ten}'`
        }


        if (objCondition.hasOwnProperty('DaXoa')) {
            strWhere += ` and ${this.table}.DaXoa = ${objCondition.DaXoa}`
        }

        if (objCondition.hasOwnProperty('HoatDong')) {
            strWhere += ` and ${this.table}.HoatDong = ${objCondition.HoatDong}`
        }

        if (objCondition.hasOwnProperty('ThoiGianTao')) {
            strWhere += ` and ${this.table}.ThoiGianTao > ${objCondition.ThoiGianTao}`
        }

        if (objCondition.parent) {
            strWhere += ` and ${this.table}.IDTheLoaiCha is null`
        }

        return strWhere
    }

    getDetail = async (objCondition) => {
        if (!objCondition) {
            return ResponseUtil.response(false, "Tham số không hợp lệ")
        }
        try {
            objCondition = DBUtil.object_filter(objCondition)
            const strWhere = this._buildWhereQuery(objCondition)
            const query = `select * from theloai ${strWhere}`

            const dataResponse = await DBConnection.query(query)
            if (!dataResponse || !dataResponse[0]) {
                throw new Error("Không thể thao tác database")
            }

            return ResponseUtil.response(true, "Thành công", dataResponse[0])
        } catch (error) {
            return ResponseUtil.response(false, "Lỗi hệ thống")
        }
    }
    GetCategryParent = async (objCondition) => {
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ` left join theloai tl2 on ${this.table}.id = tl2.IDTheLoaiCha`
            strSelect += _buildSelect(['id'], 'tl2', 'children_')
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`
            const arrData = await dbconnect.query(query)
            var arrCount = null;
            if (objCondition.rowCount) {
                const queryCount = `select COUNT(theloai.id) as rowCount from theloai ${strWhere}`
                arrCount = await dbconnect.query(queryCount)

                if (!arrCount) {
                    return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
                }
                if (!arrCount[0]) {
                    return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
                }
            }
                // var queryParent=`SELECT * FROM ${this.table} WHERE IDTheLoaiCha IS NULL`
                // const dataParent=await DBConnection.query(queryParent)
                // if(!dataParent || !dataParent[0]) {
                //     throw new Error("Không thể thao tác database")
                // }
                // var queryChild=`SELECT * FROM ${this.table} WHERE IDTheLoaiCha IS NULL`
                // const dataChild=await DBConnection.query(queryChild)
                // console.log(dataChild[0])

                // return ResponseUtil.response(true, 'Thành công', {data: dataParent[0]})

            } catch (error) {
                return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error.message])
            }
        }

}

module.exports = new CategoryModel()