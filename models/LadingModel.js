const DBUtil = require("../utils/DBUtil")
const { _buildInsertField, _buildSelect, buildFieldQuery } = require("../utils/DBUtil")
const GeneralUtil = require("../utils/GeneralUtil")
const { checkIsEmptyObject } = require("../utils/GeneralUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const dbconnect = require('./DBConnection')
class LadingModel {
    constructor() {
        this.table = "vandon"
    }
    get = async (objCondition) => {
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ''
            if(objCondition.joinOrder) {
                strJoin = ` left join donhang on ${this.table}.IDDonHang = donhang.id`
                const arrFieldOrderSelect = [
                    "id",
                    "IDTaiKhoan",
                    "IDPhuongThucThanhToan",
                    "ThoiGianTao",
                    "TongGiaTriDonHang",
                    "GiaVanChuyen",
                    "MaDonHang",
                    "ThongTinDatHang"
                ]
                strSelect += _buildSelect(arrFieldOrderSelect, 'donhang', 'donhang_')
            }
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`
            const arrData = await dbconnect.query(query)
            var arrCount = null;

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }

            if (objCondition.rowCount) {
                const queryCount = `select COUNT(vandon.id) as rowCount from vandon ${strWhere}`
                arrCount = await dbconnect.query(queryCount)

                if (!arrCount) {
                    return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
                }
                if (!arrCount[0]) {
                    return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
                }
                return ResponseUtil.response(true, 'Thành công', { data: arrData[0], rowCount: arrCount[0].rowCount })

            }

            return ResponseUtil.response(true, 'Thành công', arrData[0])
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error])
        }
    }

    insert = async (objData) => {
        var error = []
        if (objData.IDDonHang === "") {
            error.push('Mã đơn hàng không được để trống')
        }
        if (error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {
            const objField = {
                IDDonHang: objData.IDDonHang,
                TrangThai: 0, //0 là đang vận chuyển, 1 là đã vận chuyển
                ThoiGianTao: new Date().getTime() / 1000,
            }

            const strField = buildFieldQuery(objField)
            if (strField === "" || !strField) {
                throw new Error('build query thất bại')
            }
            const arrValue = _buildInsertField(strField, objField)

            const query = `insert into vandon(${strField}) values(?)`
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

    update = async (objData, objCondition) => {
        const error = []
        if (checkIsEmptyObject(objData)) {
            error.push('Dữ liệu cần sửa không hợp lệ')
        }
        if (checkIsEmptyObject(objCondition)) {
            error.push('Thiếu điều kiện cập nhật')
        }

        if (error.length > 0) {
            return ResponseUtil.response(false, "Dữ liệu truyền vào không hợp lệ", [], error)
        }
        try {
            var dataUpdate = {
                IDDonHang: objData.IDDonHang ? objData.IDDonHang : undefined,
                TrangThai: objData.TrangThai ? objData.TrangThai : undefined, //0 là đang vận chuyển, 1 là đã vận chuyển
                ThoiGianCapNhat: new Date().getTime() / 1000,
            }

            dataUpdate = DBUtil.object_filter(dataUpdate)

            const query = `update vandon set ? where ?`

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

    _buildWhereQuery = (objCondition) => {
        var strWhere = "where 1=1 "
        if (GeneralUtil.checkIsEmptyObject(objCondition)) {
            return strWhere
        }

        if (objCondition.hasOwnProperty('id') && objCondition.id) {
            strWhere += ` and ${this.table}.id = ${objCondition.id}`
        }

        if (objCondition.IDDonHang) {
            strWhere += ` and ${this.table}.IDDonHang = ${objCondition.IDDonHang}`
        }

        if (objCondition.hasOwnProperty('TrangThai')) {
            strWhere += ` and ${this.table}.TrangThai = ${objCondition.TrangThai}`
        }
        return strWhere
    }
}

module.exports = new LadingModel