const { _buildSelect, buildFieldQuery, _buildInsertField } = require("../utils/DBUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const DBConnection = require("./DBConnection")
const ProductModel = require("./ProductModel")
const UserModel = require("./UserModel")

class OrderModel {
    constructor() {
        this.table = "chitietdonhang"
    }
    get = async(objCondition) => {
        if(!objCondition || Object.keys(objCondition).length === 0 ) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }
        var page = objCondition.page ? objCondition.page : 1;
        var offsetStart= (page -1)*10
        try {
            var strWhere = this._buildWhere(objCondition, this.table)
            var strJoin = ''
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table) // select donhang.*

            if(objCondition.joinProduct) {
                strJoin += ` left join sanpham on ${this.table}.IDSanPham = sanpham.id`
                var arrFieldProductSelect = [
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
                strSelect += _buildSelect(arrFieldProductSelect, 'sanpham', 'SanPham_')
            }

            if(objCondition.joinOrder) {
                strJoin += ` left join donhang on ${this.table}.IDDonHang = donhang.id`

                var arrFieldOrderField = [
                    'IDTaiKhoan',
                    'IDPhuongThucThanhToan',
                    'ThoiGianTao',
                    'PhuPhi',
                    'TrangThai',
                    'MaChietKhau',
                    'TongGiaTriChietKhau',
                    'GiaVanChuyen',
                    'MaDonHang',
                    'ThongTinDatHang'
                ]

                strSelect += _buildSelect(arrFieldOrderField, 'donhang', 'DonHang_')

                strJoin += ` left join taikhoan on donhang.IDTaiKhoan = taikhoan.id `

                var arrFieldUser = [
                    'HoTen',
                    'Email',
                    'SoDienThoai',
                    'TinhThanh',
                    'QuanHuyen',
                    'PhuongXa',
                    'SoNha'
                ]
                strSelect += _buildSelect(arrFieldUser, 'taikhoan', 'TaiKhoan_')
            }
            
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`

            const response = await DBConnection.query(query)

            if(!response || !response[0]) {
                throw new Error('Lỗi kết nối database')
            }
            const dataOrder = response[0]
            var tongPhiVanChuyen =0
            var tongThanhTien = 0
            const dataFormat = {
                HoTen: dataOrder[0] && dataOrder[0].TaiKhoan_HoTen ? dataOrder[0].TaiKhoan_HoTen : null,
                Email: dataOrder[0] && dataOrder[0].TaiKhoan_Email ? dataOrder[0].TaiKhoan_Email : null,
                SoDienThoai: dataOrder[0] && dataOrder[0].TaiKhoan_SoDienThoai ? dataOrder[0].TaiKhoan_SoDienThoai : null,
                TinhThanh: dataOrder[0] && dataOrder[0].TaiKhoan_TinhThanh ? dataOrder[0].TaiKhoan_TinhThanh : null,
                PhuongXa: dataOrder[0] && dataOrder[0].TaiKhoan_PhuongXa ? dataOrder[0].TaiKhoan_PhuongXa : null,
                QuanHuyen: dataOrder[0] && dataOrder[0].TaiKhoan_QuanHuyen ? dataOrder[0].TaiKhoan_QuanHuyen : null,
                SoNha: dataOrder[0] && dataOrder[0].TaiKhoan_SoNha ? dataOrder[0].TaiKhoan_SoNha : null,
                IDDonhang: dataOrder[0] && dataOrder[0].IDDonHang ? dataOrder[0].IDDonHang : 0,
                GiaVanChuyen: dataOrder[0] && dataOrder[0].DonHang_GiaVanChuyen ? dataOrder[0].DonHang_GiaVanChuyen : 0,
                IDPhuongThucThanhToan: dataOrder[0] && dataOrder[0].DonHang_IDPhuongThucThanhToan ? dataOrder[0].DonHang_IDPhuongThucThanhToan : 0,
                IDTaiKhoan: dataOrder[0] && dataOrder[0].DonHang_IDTaiKhoan ? dataOrder[0].DonHang_IDTaiKhoan : null,
                MaChietKhau: dataOrder[0] && dataOrder[0].DonHang_MaChietKhau  ? dataOrder[0].DonHang_MaChietKhau : null,
                MaDonHang: dataOrder[0] && dataOrder[0].DonHang_MaDonHang ? dataOrder[0].DonHang_MaDonHang : null,
                PhuPhi: dataOrder[0] && dataOrder[0].DonHang_PhuPhi ? dataOrder[0].DonHang_PhuPhi : 0,
                ThoiGianTao: dataOrder[0] && dataOrder[0].DonHang_ThoiGianTao ? dataOrder[0].DonHang_ThoiGianTao : null,
                ThongTinDatHang:   dataOrder[0] && dataOrder[0].DonHang_ThongTinDatHang ? dataOrder[0].DonHang_ThongTinDatHang : null,
                TongGiaTriChietKhau : dataOrder[0] && dataOrder[0].DonHang_TongGiaTriChietKhau ? dataOrder[0].DonHang_TongGiaTriChietKhau : null,
                TongGiaTriDonHang : dataOrder[0] && dataOrder[0].DonHang_TongGiaTriDonHang ? dataOrder[0].DonHang_TongGiaTriDonHang : null,
                TrangThai: dataOrder[0] && dataOrder[0].DonHang_TrangThai ? dataOrder[0].DonHang_TrangThai : 0,
                List: []
            }
            for (let index = 0; index < dataOrder.length; index++) {
                tongPhiVanChuyen += dataOrder[index].PhiVanChuyen
                tongThanhTien += dataOrder[index].ThanhTien

                var dataItemFormat = {
                    IDSanPham: dataOrder[index].IDSanPham,
                    PhiVanChuyen: dataOrder[index].PhiVanChuyen,
                    SanPham_CanNang: dataOrder[index].SanPham_CanNang,
                    SanPham_GiaGoc: dataOrder[index].SanPham_GiaGoc,
                    SanPham_HinhAnh: dataOrder[index].SanPham_HinhAnh,
                    SanPham_IDNhaCungCap: dataOrder[index].SanPham_IDNhaCungCap,
                    SanPham_IDTheLoai: dataOrder[index].SanPham_IDTheLoai,
                    SanPham_KichThuoc: dataOrder[index].SanPham_KichThuoc,
                    SanPham_MauSac: dataOrder[index].SanPham_MauSac,
                    SanPham_MoTa: dataOrder[index].SanPham_MoTa,
                    SanPham_Ten: dataOrder[index].SanPham_Ten,
                    SanPham_XuatXu: dataOrder[index].SanPham_XuatXu,
                    SoLuong: dataOrder[index].SoLuong,
                    ThanhTien: dataOrder[index].ThanhTien,
                    ThoiGianTao: dataOrder[index].ThoiGianTao,
                    id: dataOrder[index].id
                }
                dataFormat.List.push(dataItemFormat)
            }
            dataFormat.TongPhiVanChuyen = tongPhiVanChuyen,
            dataFormat.TongThanhTien = tongThanhTien*1 + dataFormat.PhuPhi*1
            return ResponseUtil.response(true, 'Thành công', dataFormat)
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    
    insert = async (objData) => {
        if(!objData || Object.keys(objData).length === 0) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        try {
            const data = {
                IDSanPham: objData.IDSanPham,
                IDDonHang: objData.IDDonHang,
                SoLuong: objData.SoLuong,
                DonGia: objData.DonGia,
                ThanhTien: objData.ThanhTien,
                PhiVanChuyen: objData.PhiVanChuyen,
                ThoiGianTao: new Date().getTime()/1000
            }
            const strField = buildFieldQuery(data)
            if(!strField) {
                return ResponseUtil.response(false, 'Tham số không hợp lệ')
            }

            const arrValue = _buildInsertField(strField, data)


            const query = `insert into ${this.table}(${strField}) values(?)`
            const result = await DBConnection.query(query, [arrValue])
            if(!result || !result[0]) {
                return ResponseUtil.response(false, 'Không thể kết nối database')
            }
            if(result[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thêm thất bại')
            }
            return ResponseUtil.response(true, "Thành công")
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    _buildWhere = (objCondition, table) => {
        var strWhere = " where 1=1 "

        if(objCondition.id) {
            strWhere += ` and ${table}.id = ${objCondition.id} `
        }

        if(objCondition.IDSanPham) {
            strWhere += ` and ${table}.IDSanPham = ${objCondition.IDSanPham}`
        }

        if(objCondition.IDPhuongThucThanhToan) {
            strWhere += ` and ${table}.IDPhuongThucThanhToan = ${objCondition.IDPhuongThucThanhToan} `
        }
        if(objCondition.IDDonHang) {
            strWhere += ` and ${table}.IDDonHang = ${objCondition.IDDonHang}`
        }
        if(objCondition.hasOwnProperty("DaXoa")) {
            strWhere += ` and ${table}.DaXoa = ${objCondition.DaXoa} `
        }

        if(objCondition.hasOwnProperty("TrangThai")) {
            strWhere += ` and ${table}.TrangThai = ${objCondition.TrangThai}`
        }
        return strWhere
    }
}

module.exports = new OrderModel()