const dbconnect = require("./DBConnection")
const ResponseUtil = require("../utils/ResponseUtil")
const GeneralUtil = require("../utils/GeneralUtil")
const { object_filter, buildFieldQuery, _buildSelect } = require("../utils/DBUtil")
const fs = require('fs')
const path = require("path")
class ProductModel {
    constructor() {
        this.table = "sanpham"
    }
    get = async (objCondition) => {
        if (!objCondition || !objCondition.page) {
            objCondition = { ...objCondition, page: 1 }
        }
        if (objCondition.page < 1) {
            return ResponseUtil.response(false, "Trang không hợp lệ")
        }
        var start = (objCondition.page - 1) * 20
        try {
            var strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            var strJoin = ""
            var strOrder = ""
            strSelect += _buildSelect(['*'], this.table)
            if (objCondition.joinCategory) {
                strJoin += ` left join theloai on ${this.table}.IDTheLoai = theloai.id`
                var arrFieldCategorySelect = [
                    'Ten',
                    'HoatDong',
                    'IDTheLoaiCha'
                ]
                strSelect += _buildSelect(arrFieldCategorySelect, 'theloai', 'TheLoai_')
            }

            if (objCondition.joinSupplier) {
                strJoin += ` left join nhacungcap on ${this.table}.IDNhaCungCap = nhacungcap.id`
                var arrFieldSupplierSelect = [
                    'Ten',
                    'TrangThai',
                ]
                strSelect += _buildSelect(arrFieldSupplierSelect, 'nhacungcap', 'NhaCungCap_')
            }

            if ((objCondition.SessionID || objCondition.IDTaiKhoan) && objCondition.fromCart) {
                strJoin += ` left join chitietgiohang on ${this.table}.id = chitietgiohang.IDSanPham`
                strJoin += ` left join giohang on chitietgiohang.IDGioHang = giohang.id`

                var arrFieldCartItemSelect = [
                    'id',
                    'SoLuong',
                ]
                strSelect += _buildSelect(arrFieldCartItemSelect, 'chitietgiohang', 'ChiTietGioHang_')

                var arrFieldCartSelect = [
                    'id',
                    'IDTaiKhoan',
                    'SessionID'
                ]

                strSelect += _buildSelect(arrFieldCartSelect, 'giohang', 'GioHang_')

                if (objCondition.IDTaiKhoan) {
                    strWhere += ` and giohang.IDTaiKhoan = '${objCondition.IDTaiKhoan}'`
                } else {
                    strWhere += ` and giohang.SessionID = '${objCondition.SessionID}'`
                }
            }

            // lấy những sản phẩm có khuyến mãi thì thêm params joinDiscount = true
            if(objCondition.joinDiscount) {
                strJoin += ` join chietkhau on ${this.table}.id = chietkhau.IDSanPham`
                const arrFieldDiscountSelect = [
                    'id',
                    'TrangThai',
                    'TenChuongTrinh',
                    'GiaChietKhauToiDa',
                    'DieuKienGiaToiThieu',
                    'DieuKienGiaToiDa',
                    'SoLuongSuDungToiDa',
                    'ThoiGianBatDau',
                    'ThoiGianKetThuc',
                    'IDPhuongThucThanhToan',
                    'ThoiGianTao',
                    'DaXoa',
                    'GiaTriChietKhau',
                    'PhanTramChietKhau',
                    'MaChietKhau'
                ]
                strSelect += _buildSelect(arrFieldDiscountSelect, 'chietkhau', 'ChietKhau_')

                // chỉ lấy 1 mã khuyến mãi hợp lệ cho 1 sản phẩm thôi, ra 2 sản phẩm giống nhau là sai nghiệp vụ
                strWhere += ` and chietkhau.DaXoa = 0`
                strWhere += ` and chietkhau.TrangThai = 1`
                strWhere += ` and chietkhau.ThoiGianBatDau <= ${new Date().getTime()/1000}`
                strWhere += ` and chietkhau.ThoiGianKetThuc >= ${new Date().getTime()/1000}`
            }

            if(objCondition.new) {
                strOrder = ` ORDER BY ${this.table}.id DESC`
            }
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere} ${strOrder} limit 20 offset ${start}`
            const arrData = await dbconnect.query(query)

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }

            if (objCondition.getRowCount) {
                const queryCount = `select COUNT(sanpham.id) as rowCount from ${this.table} ${strJoin} ${strWhere}`
                const arrCount = await dbconnect.query(queryCount)

                if (!arrCount) {
                    return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
                }
                if (!arrCount[0]) {
                    return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
                }

                return ResponseUtil.response(true, 'Thành công', { data: arrData[0], rowCount: arrCount[0][0].rowCount })
            }
            return ResponseUtil.response(true, 'Thành công', arrData[0])
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error.message])
        }
    }
    //get-all new
    featuredProduct = async(objCondition) => {
        if (!objCondition || !objCondition.page) {
            objCondition = { ...objCondition, page: 1 }
        }
        if (objCondition.page < 1) {
            return ResponseUtil.response(false, "Trang không hợp lệ")
        }
        var start = (objCondition.page - 1) * 8
        try {
            var strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            var strJoin = ""
            strSelect += _buildSelect(['*'], this.table)
            if (objCondition.joinCategory) {
                strJoin += ` left join theloai on ${this.table}.IDTheLoai = theloai.id`
                var arrFieldCategorySelect = [
                    'Ten',
                    'HoatDong',
                    'IDTheLoaiCha'
                ]
                strSelect += _buildSelect(arrFieldCategorySelect, 'theloai', 'TheLoai_')
            }

            if (objCondition.joinSupplier) {
                strJoin += ` left join nhacungcap on ${this.table}.IDNhaCungCap = nhacungcap.id`
                var arrFieldSupplierSelect = [
                    'Ten',
                    'TrangThai',
                ]
                strSelect += _buildSelect(arrFieldSupplierSelect, 'nhacungcap', 'NhaCungCap_')
            }

            if ((objCondition.SessionID || objCondition.IDTaiKhoan) && objCondition.fromCart) {
                strJoin += ` left join chitietgiohang on ${this.table}.id = chitietgiohang.IDSanPham`
                strJoin += ` left join giohang on chitietgiohang.IDGioHang = giohang.id`

                var arrFieldCartItemSelect = [
                    'id',
                    'SoLuong',
                ]
                strSelect += _buildSelect(arrFieldCartItemSelect, 'chitietgiohang', 'ChiTietGioHang_')

                var arrFieldCartSelect = [
                    'id',
                    'IDTaiKhoan',
                    'SessionID'
                ]

                strSelect += _buildSelect(arrFieldCartSelect, 'giohang', 'GioHang_')

                if (objCondition.IDTaiKhoan) {
                    strWhere += ` and giohang.IDTaiKhoan = '${objCondition.IDTaiKhoan}'`
                } else {
                    strWhere += ` and giohang.SessionID = '${objCondition.SessionID}'`
                }
            }

            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere} limit 20 offset ${start}`
            const arrData = await dbconnect.query(query)

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }

            if (objCondition.getRowCount) {
                const queryCount = `select COUNT(sanpham.id) as rowCount from sanpham ${strWhere}`
                const arrCount = await dbconnect.query(queryCount)

                if (!arrCount) {
                    return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
                }
                if (!arrCount[0]) {
                    return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
                }

                return ResponseUtil.response(true, 'Thành công', { data: arrData[0], rowCount: arrCount[0][0].rowCount })
            }
            return ResponseUtil.response(true, 'Thành công', arrData[0])
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error.message])
        }
    }
    getDetail = async (objCondition) => {
        try {
            const strWhere = this._buildWhereQuery(objCondition)
            var strSelect = 'select 1'
            var strJoin = ""
            strSelect += _buildSelect(['*'], this.table)
            if (objCondition.joinCategory) {
                strJoin += ` left join theloai on ${this.table}.IDTheLoai = theloai.id`
                var arrFieldCategorySelect = [
                    'Ten',
                    'HoatDong',
                    'IDTheLoaiCha'
                ]
                strSelect += _buildSelect(arrFieldCategorySelect, 'theloai', 'TheLoai_')
            }

            if (objCondition.joinSupplier) {
                strJoin += ` left join nhacungcap on ${this.table}.IDNhaCungCap = nhacungcap.id`
                var arrFieldSupplierSelect = [
                    'Ten',
                    'TrangThai',
                ]
                strSelect += _buildSelect(arrFieldSupplierSelect, 'nhacungcap', 'NhaCungCap_')
            }
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere} limit 1`
            const arrData = await dbconnect.query(query)

            if (!arrData) {
                return ResponseUtil.response(false, 'Không thể truy xuất dữ liệu từ database', [], ['Truy xuất dữ liệu thất bại'])
            }
            if (!arrData[0]) {
                return ResponseUtil.response(true, 'Không có dữ liệu', [], ['Không tìm thấy dữ liệu'])
            }
            if (arrData[0][0] && arrData[0][0].HinhAnh) {
                arrData[0][0].HinhAnh = JSON.parse(arrData[0][0].HinhAnh)
            }
            return ResponseUtil.response(true, 'Thành công', arrData[0][0])
        } catch (error) {
            return ResponseUtil.response(false, 'Lỗi hệ thống', [], [error.message])
        }
    }
    insert = async (objProduct) => {
        var error = []
        if (objProduct.Ten === "") {
            error.push('Tên nhà cung cấp không được để trống')
        }

        if (!objProduct.SoLuong) {
            error.push('Số lượng không đươc để trống')
        }
        if (!objProduct.GiaGoc) {
            error.push('Giá gốc không được để trống')
        }

        if (!objProduct.IDTheLoai) {
            error.push('Thể loại không được để trống')
        }

        if (!objProduct.IDNhaCungCap) {
            error.push('Nhà cung cấp không được để trống')
        }
        if (error.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], error)
        }

        try {

            const categoryExist = await dbconnect.query("select * from theloai where id =? limit 1", [objProduct.IDTheLoai])
            const supplierExist = await dbconnect.query("select * from nhacungcap where id =? limit 1", [objProduct.IDNhaCungCap])

            if (!categoryExist || !categoryExist[0] || categoryExist[0].length === 0) {
                return ResponseUtil.response(false, 'Ngành hàng không tồn tại')
            }

            if (!supplierExist || !supplierExist[0] || supplierExist[0].length === 0) {
                return ResponseUtil.response(false, 'Nhà cung cấp không tồn tại')
            }

            var listImageName
            if (objProduct.images && objProduct.images.length > 0) {
                const arrImages = []
                for (let index = 0; index < objProduct.images.length; index++) {
                    arrImages.push(objProduct.images[index].filename)
                }
                listImageName = JSON.stringify(arrImages)
            }
            var objField = {
                Ten: objProduct.Ten,
                TrangThai: 1,
                DaXoa: 0,
                XuatXu: objProduct.XuatXu ? objProduct.XuatXu : "",
                MauSac: objProduct.MauSac ? objProduct.MauSac : undefined,
                KichThuoc: objProduct.KichThuoc ? objProduct.KichThuoc : undefined,
                CanNang: objProduct.CanNang ? objProduct.CanNang : undefined,
                SoLuong: objProduct.SoLuong ? objProduct.SoLuong : 0,
                MoTa: objProduct.MoTa ? objProduct.MoTa : "",
                GiaGoc: objProduct.GiaGoc,
                IDTheLoai: objProduct.IDTheLoai,
                IDNhaCungCap: objProduct.IDNhaCungCap,
                ThoiGianTao: new Date().getTime() / 1000,
                HinhAnh: listImageName ? listImageName : undefined
            }
            objField = object_filter(objField)
            const strField = buildFieldQuery(objField)
            if (strField === "" || !strField) {
                throw new Error('build query thất bại')
            }

            const arrField = strField.split(', ')

            var arrValue = []

            for (let i = 0; i < arrField.length; i++) {
                arrValue.push(objField[arrField[i].trim()])
            }
            const query = `insert into sanpham(${strField}) values(?)`
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

    update = async (objProduct) => {
        if (GeneralUtil.checkIsEmptyObject(objProduct)) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }
        const id = objProduct.id
        objProduct.id = undefined
        if (!id) {
            return ResponseUtil.response(false, 'Tham số id không được bỏ trống')
        }
        try {
            // Xử lý thêm hình ảnh mới
            var listImageName
            if (objProduct.images && objProduct.images.length > 0) {
                const arrImages = []
                for (let index = 0; index < objProduct.images.length; index++) {
                    arrImages.push(objProduct.images[index].filename)
                }
                listImageName = JSON.stringify(arrImages)
                // Xử lý xóa hình ảnh cũ
                if (objProduct.HinhAnh) {
                    try {
                        const arrUrlImages = JSON.parse(objProduct.HinhAnh)
                        if (arrUrlImages && arrUrlImages.length > 0) {
                            for (let index = 0; index < arrUrlImages.length; index++) {
                                fs.unlinkSync(path.join(`${__dirname}/../public/images/${arrUrlImages[index]}`))
                            }
                        }
                    } catch (error) {
                    }
                }
            }
            var objField = {
                Ten: objProduct.Ten,
                TrangThai: 1,
                DaXoa: 0,
                XuatXu: objProduct.XuatXu && objProduct.XuatXu !== 'null' ? objProduct.XuatXu : undefined,
                MauSac: objProduct.MauSac && objProduct.MauSac !== 'null' ? objProduct.MauSac : undefined,
                KichThuoc: objProduct.KichThuoc && objProduct.KichThuoc !== 'null' ? objProduct.KichThuoc : undefined,
                CanNang: objProduct.CanNang && objProduct.CanNang !== 'null' ? objProduct.CanNang : undefined,
                SoLuong: objProduct.SoLuong && objProduct.SoLuong !== 'null' ? objProduct.SoLuong : 0,
                MoTa: objProduct.MoTa && objProduct.MoTa !== 'null' ? objProduct.MoTa : undefined,
                GiaGoc: objProduct.GiaGoc,
                IDTheLoai: objProduct.IDTheLoai,
                IDNhaCungCap: objProduct.IDNhaCungCap,
                ThoiGianCapNhat: new Date().getTime() / 1000,
                HinhAnh: listImageName && listImageName !== 'null' ? listImageName : undefined
            }
            objField = object_filter(objField)

            const query = `update sanpham set ? where ?`

            const response = await dbconnect.query(query, [objField, { id: id }])

            if (!response || !response[0]) {
                throw new Error('Có lỗi xảy ra khi kết nối database')
            }

            if (response[0].affectedRows > 0) {
                return ResponseUtil.response(true, 'Sửa dữ liệu thành công')
            }
            return ResponseUtil.response(false, 'Sửa dữ liệu thất bại')
        } catch (error) {
            return ResponseUtil.response(false, 'Có lỗi xảy ra', [], [error.message])
        }
    }

    delete = async (id) => {
        try {
            const query = `update sanpham set ? where ?`
            const response = await dbconnect.query(query, [{ DaXoa: 1 }, { id: id }])

            if (!response || !response[0]) {
                throw new Error('Không thể kết nối database')
            }

            if (response[0].affectedRows > 0) {
                return ResponseUtil.response(true, 'Thành công')
            }
            return ResponseUtil.response(false, 'Xóa dữ liệu thất bại.')

        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    _buildWhereQuery = (objCondition) => {
        var strWhere = "where 1=1 "
        if (GeneralUtil.checkIsEmptyObject(objCondition)) {
            return strWhere
        }
        if (objCondition.id) {
            var id = (objCondition.id + '').split(',')
            if (id.length > 1) {
                strWhere += ` and (1=0 `
                for (let index = 0; index < id.length; index++) {
                    strWhere += ` or ${this.table}.id = ${id[index]}`
                }
                strWhere += ` )`
            } else {
                strWhere += ` and ${this.table}.id = ${objCondition.id}`
            }
        }

        if(objCondition.hasOwnProperty('Ten') && objCondition.Ten) {
            strWhere += ` and ${this.table}.Ten LIKE '%${objCondition.Ten}%'`
        }

        if (objCondition.hasOwnProperty('DaXoa')) {
            strWhere += ` and ${this.table}.DaXoa = ${objCondition.DaXoa}`
        }

        if (objCondition.hasOwnProperty('TrangThai')) {
            strWhere += ` and ${this.table}.TrangThai = ${objCondition.TrangThai}`
        }
        if (objCondition.hasOwnProperty('ThoiGianTao')) {
            strWhere += ` and ${this.table}.ThoiGianTao > ${objCondition.ThoiGianTao}`
        }
        if (objCondition.isStoking) {
            strWhere += ` and ${this.table}.SoLuong > 0`
        }
        if(objCondition.IDNhaCungCap) {
            strWhere += ` and ${this.table}.IDNhaCungCap = ${objCondition.IDNhaCungCap}`
        }
        if(objCondition.IDTheLoai) {
            strWhere += ` and ${this.table}.IDTheLoai = ${objCondition.IDTheLoai}`
        }
        return strWhere
    }

}

module.exports = new ProductModel()