const DBUtil = require("../utils/DBUtil")
const { _buildInsertField, _buildSelect, buildFieldQuery, object_filter } = require("../utils/DBUtil")
const GeneralUtil = require("../utils/GeneralUtil")
const { checkIsEmptyObject } = require("../utils/GeneralUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const dbconnect = require('./DBConnection')
const OrderModel = require("./OrderModel")
class ExchangeModel {
    constructor() {
        this.table = "dondoitra"
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
                    "ThongTinDatHang",
                    "TrangThai",
                    "ThongTinDatHang",
                    "PhuPhi"
                ]
                strSelect += _buildSelect(arrFieldOrderSelect, 'donhang', 'DonHang_')
            }
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere} order by ${this.table}.ThoiGianTao desc`
            const arrData = await dbconnect.query(query)
            var arrCount = null;

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }

            if (objCondition.rowCount) {
                const queryCount = `select COUNT(dondoitra.id) as rowCount from dondoitra ${strWhere}`
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
        if (!objData.IDDonHang || objData.IDDonHang === "") {
            error.push('Mã đơn hàng không được để trống')
        }
        if (error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {
            var objField = {
                LyDo: objData.LyDo ? objData.LyDo : undefined,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan ? objData.IDPhuongThucThanhToan : undefined,
                PhuPhi: objData.PhuPhi ? objData.PhuPhi : undefined,
                IDDonHang: objData.IDDonHang,
                ThoiGianTao: new Date().getTime() / 1000,
            }

            //lấy thông tin đơn hàng cũ
            const orderResponse = await OrderModel.get({id: objField.IDDonHang})
            if(!orderResponse || !orderResponse.message || orderResponse.data[0].length === 0) {
                return ResponseUtil.response(false, 'Lấy thông tin đơn hàng thất bại')
            }

            const orderData = orderResponse.data[0][0]
            if(orderData.TrangThai === 6 || orderData.TrangThai <3) {
                return ResponseUtil.response(false, "Đơn hàng đã bị hủy hoặc chưa được giao nên không thể đổi trả")
            }
            objField = object_filter(objField)

            const strField = buildFieldQuery(objField)
            if (strField === "" || !strField) {
                throw new Error('build query thất bại')
            }
            const arrValue = _buildInsertField(strField, objField)

            const query = `insert into dondoitra(${strField}) values(?)`
            const dataResponse = await dbconnect.query(query, [arrValue])

            if (!dataResponse || !dataResponse[0]) {
                return ResponseUtil.response(false, 'Không thể truy xuất database', [], ['Không thể truy xuất database'])
            }
            if (dataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại', [], 'Dữ liệu không hợp lệ')
            }

            // nếu có phí thì tính toán lại đơn hàng
            if(objField.PhuPhi && objField.PhuPhi > 0) {
                const updateOrderResponse = await OrderModel.update({
                    PhuPhi: orderData.PhuPhi + objField.PhuPhi,
                    TongGiaTriDonHang: orderData.TongGiaTriDonHang*1 + objField.PhuPhi*1,
                    TrangThai: 4
                }, {id: objField.IDDonHang})

                if(!updateOrderResponse || !updateOrderResponse.success) {
                    throw new Error('Cập nhật đơn hàng thất bại')
                }
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message, [], [error])
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
                LyDo: objData.LyDo ? objData.LyDo : undefined,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan ? objData.IDPhuongThucThanhToan : undefined,
                PhuPhi: objData.PhuPhi ? objData.PhuPhi : undefined,
                IDDonHang: objData.IDDonHang,
                ThoiGianCapNhat: new Date().getTime() / 1000,
            }

            dataUpdate = DBUtil.object_filter(dataUpdate)

            const query = `update dondoitra set ? where ?`

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
        if(!objCondition || !objCondition.id) {
            return ResponseUtil.response(false, 'Không có điều kiện xóa')
        }

        try {
            const query = `delete from dondoitra where ?`

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
        if (GeneralUtil.checkIsEmptyObject(objCondition)) {
            return strWhere
        }

        if (objCondition.hasOwnProperty('id') && objCondition.id) {
            strWhere += ` and ${this.table}.id = ${objCondition.id}`
        }

        if (objCondition.IDDonHang) {
            strWhere += ` and ${this.table}.IDDonHang = ${objCondition.IDDonHang}`
        }
        if(objCondition.startDate) {
            strWhere += ` and ( ${table}.ThoiGianTao BETWEEN ${objCondition.startDate}`
            if(objCondition.endDate) {
                strWhere +=  ` and ${objCondition.endDate} )`
            }else {
                strWhere += ` and ${new Date().getTime()/1000}`
            }
        }

        if(!objCondition.startDate && objCondition.endDate) {
            strWhere += ` and ( ${table}.MaChietKhau BETWEEN 0 AND ${objCondition.endDate})`
        } 
        return strWhere
    }
}

module.exports = new ExchangeModel