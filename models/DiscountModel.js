const DBUtil = require("../utils/DBUtil")
const { _buildInsertField, _buildSelect, buildFieldQuery, object_filter } = require("../utils/DBUtil")
const GeneralUtil = require("../utils/GeneralUtil")
const { checkIsEmptyObject } = require("../utils/GeneralUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const dbconnect = require('./DBConnection')
const uniqid = require('uniqid')
const OrderModel = require('./OrderModel')
class DiscountModel {
    constructor() {
        this.table = "chietkhau"
    }
    get = async (objCondition) => {
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ''
            if(objCondition.joinProduct) {
                strJoin = ` left join sanpham on ${this.table}.IDDonHang = sanpham.id`
                const arrFieldProductSelect = [
                    'Ten',
                    'HinhAnh',
                    'XuatXu',
                    'MauSac',
                    'KichThuoc',
                    'CanNang',
                    'MoTa',
                    'GiaGoc',
                    'IDTheLoai',
                    'IDNhaCungCap'
                ]
                strSelect += _buildSelect(arrFieldOrderSelect, 'sanpham', 'SanPham_')
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
                const queryCount = `select COUNT(chietkhau.id) as rowCount from chietkhau ${strWhere}`
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
        if (!objData.TenChuongTrinh) {
            error.push('Tên chương trình không được để trống')
        }
        if(!objData.ThoiGianBatDau || !objData.ThoiGianKetThuc || objData.ThoiGianBatDau >= objData.ThoiGianKetThuc ) {
            error.push('Thời gian chương trình hoạt động không hợp lệ')
        }

        if(!objData.PhanTramChietKhau && !objData.GiaTriChietKhau) {
            error.push('Vui lòng nhập giá trị giảm giá')
        }
        if (error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {
            //Nếu là khuyến mãi cho sản phẩm thì phải kiểm tra xem sản phẩm đó đã có khuyến mãi hay chưa, nếu có rồi thì không cho tạo
            if(objData.IDSanPham) {
                const existDiscountCondition = {
                    IDSanPham : objData.IDSanPham,
                    startDate : objData.ThoiGianBatDau,
                    endDate : objData.ThoiGianKetThuc,
                    DaXoa: 0,

                }
                const existDiscount = await this.get(existDiscountCondition)
                if(!existDiscount.success) {
                    throw new Error(existDiscount.error)
                }
                if(existDiscount.data.length > 0) {
                    return  ResponseUtil.response(false, 'Sản phẩm này đã có chương trình giảm giá. Không thể tạo mới.')
                }
            }
            const MaChietKhau = uniqid('discount-')
            var objField = {
                ThoiGianTao: new Date().getTime() / 1000,
                TrangThai: 1,
                TenChuongTrinh: objData.TenChuongTrinh ? objData.TenChuongTrinh : undefined,
                GiaChietKhauToiDa: objData.GiaChietKhauToiDa ? objData.GiaChietKhauToiDa : undefined,
                DieuKienGiaToiThieu: objData.DieuKienGiaToiThieu ? objData.DieuKienGiaToiThieu : undefined,
                DieuKienGiaToiDa: objData.DieuKienGiaToiDa ? objData.DieuKienGiaToiDa : undefined,
                SoLuongSuDungToiDa: objData.SoLuongSuDungToiDa ? objData.SoLuongSuDungToiDa : undefined,
                ThoiGianBatDau: objData.ThoiGianBatDau ? objData.ThoiGianBatDau : undefined,
                ThoiGianKetThuc: objData.ThoiGianKetThuc ? objData.ThoiGianKetThuc : undefined,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan ? objData.IDPhuongThucThanhToan : undefined,
                DaXoa: 0,
                GiaTriChietKhau: objData.GiaTriChietKhau ? objData.GiaTriChietKhau : undefined,
                PhanTramChietKhau: objData.PhanTramChietKhau ? objData.PhanTramChietKhau : undefined,
                MaChietKhau,
                IDSanPham: objData.IDSanPham ? objData.IDSanPham : undefined
            }
            objField = object_filter(objField)
            const strField = buildFieldQuery(objField)
            if (strField === "" || !strField) {
                throw new Error('build query thất bại')
            }
            const arrValue = _buildInsertField(strField, objField)

            const query = `insert into chietkhau(${strField}) values(?)`
            const dataResponse = await dbconnect.query(query, [arrValue])

            if (!dataResponse || !dataResponse[0]) {
                return ResponseUtil.response(false, 'Không thể truy xuất database', [], ['Không thể truy xuất database'])
            }
            if (dataResponse[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại', [], 'Dữ liệu không hợp lệ')
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
                TrangThai: objData.TrangThai ? objData.TrangThai : undefined,
                TenChuongTrinh: objData.TenChuongTrinh ? objData.TenChuongTrinh : undefined,
                GiaChietKhauToiDa: objData.GiaChietKhauToiDa ? objData.GiaChietKhauToiDa : undefined,
                DieuKienGiaToiThieu: objData.DieuKienGiaToiThieu ? objData.DieuKienGiaToiThieu : undefined,
                DieuKienGiaToiDa: objData.DieuKienGiaToiDa ? objData.DieuKienGiaToiDa : undefined,
                SoLuongSuDungToiDa: objData.SoLuongSuDungToiDa ? objData.SoLuongSuDungToiDa : undefined,
                ThoiGianBatDau: objData.ThoiGianBatDau ? objData.ThoiGianBatDau : undefined,
                ThoiGianKetThuc: objData.ThoiGianKetThuc ? objData.ThoiGianKetThuc : undefined,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan ? objData.IDPhuongThucThanhToan : undefined,
                DaXoa: objData.DaXoa ? objData.DaXoa : undefined ,
                GiaTriChietKhau: objData.GiaTriChietKhau ? objData.GiaTriChietKhau : undefined,
                PhanTramChietKhau: objData.PhanTramChietKhau ? objData.PhanTramChietKhau : undefined,
                IDSanPham: objData.IDSanPham ? objData.IDSanPham : undefined,
                ThoiGianCapNhat: new Date().getTime() / 1000,
            }

            dataUpdate = DBUtil.object_filter(dataUpdate)

            const query = `update chietkhau set ? where ?`

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

    delete = async(id) => {
        try {
            //kiểm tra đã được sử dụng chưa
            const orderResponse = await OrderModel.get({IDChietKhau: id})

            if(!orderResponse) {
                throw new Error('Không thể kết nối database')
            }

            if(orderResponse[0] && orderResponse.length >0) {
                return ResponseUtil.response(false, 'Mã giảm giá đã được sử dụng. Không thể xóa')
            }

            const query = `delete from chietkhau where id = ?`
            const result = await dbconnect.query(query, [id])

            if(!result || !result[0]) {
                throw new Error('Không thể thực hiện')
            }
            if(result[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Không thể xóa do đã được sử dụng')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
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

        if (objCondition.IDSanPham) {
            strWhere += ` and ${this.table}.IDSanPham = ${objCondition.IDSanPham}`
        }

        if (objCondition.hasOwnProperty('TrangThai')) {
            strWhere += ` and ${this.table}.TrangThai = ${objCondition.TrangThai}`
        }
        if (objCondition.hasOwnProperty('IDPhuongThucThanhToan')) {
            strWhere += ` and ${this.table}.IDPhuongThucThanhToan = ${objCondition.IDPhuongThucThanhToan}`
        }
        if (objCondition.hasOwnProperty('DaXoa')) {
            strWhere += ` and ${this.table}.DaXoa = ${objCondition.DaXoa}`
        }
        if (objCondition.hasOwnProperty('MaChietKhau')) {
            strWhere += ` and ${this.table}.MaChietKhau = '${objCondition.MaChietKhau}'`
        }
        if (objCondition.hasOwnProperty('TenChuongTrinh')) {
            strWhere += ` and ${this.table}.TenChuongTrinh LIKE '${objCondition.TenChuongTrinh}'`
        }
        if(objCondition.validTime) {
            const now = new Date().getTime()/1000
            strWhere += ` and ${this.table}.ThoiGianBatDau <= ${now} and ${this.table}.ThoiGianKetThuc >= ${now}`
        }

        if(objCondition.startDate) {
            strWhere += ` and ( ${this.table}.ThoiGianTao BETWEEN ${objCondition.startDate}`
            if(objCondition.endDate) {
                strWhere +=  ` and ${objCondition.endDate} )`
            }else {
                strWhere += ` and ${new Date().getTime()/1000}`
            }
        }

        if(!objCondition.startDate && objCondition.endDate) {
            strWhere += ` and ( ${this.table}.MaChietKhau BETWEEN 0 AND ${objCondition.endDate})`
        } 
        return strWhere
    }
}

module.exports = new DiscountModel()