const { _buildSelect, buildFieldQuery, _buildInsertField, object_filter } = require("../utils/DBUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const DBConnection = require("./DBConnection")
const OrderDetailModel = require("./OrderDetailModel")
const ProductModel = require("./ProductModel")
const UserModel = require("./UserModel")
const uniqid = require('uniqid')
const CartModel = require("./CartModel")
const CartItemModel = require("./CartItemModel")
const DiscountModel = require("./DiscountModel")

class OrderModel {
    constructor() {
        this.table = "donhang"
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
            if(objCondition.joinUser) {
                strJoin += ` left join taikhoan on ${this.table}.IDTaiKhoan = taikhoan.id`
                var arrFieldUserSelect = [
                    'HoTen',
                    'NgaySinh',
                    'SoDienThoai',
                    'Email',
                    'TinhThanh',
                    'QuanHuyen',
                    'PhuongXa',
                    'SoNha',
                ]
                strSelect += _buildSelect(arrFieldUserSelect, 'taikhoan', 'TaiKhoan_')
            }

            if(objCondition.joinPaymentMethod) {
                strJoin += ` left join phuongthucthanhtoan on ${this.table}.IDPhuongThucThanhToan = phuongthucthanhtoan.id`
                var arrFieldPaymentMethodSelect = [
                    'TenPhuongThucThanhToan'
                ]

                strSelect += _buildSelect(arrFieldPaymentMethodSelect, 'phuongthucthanhtoan', 'PhuongThucThanhToan_')
            }
            
            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere} order by ${this.table}.ThoiGianTao desc limit 10 offset ${offsetStart} `

            const response = await DBConnection.query(query)
            const countResponse  = await DBConnection.query(`select COUNT(id) rowCount from donhang ${strWhere}`)

            if(!response || !countResponse || !response[0] || !countResponse[0]) {
                throw new Error('Lỗi kết nối database')
            }

            return ResponseUtil.response(true, 'Thành công', [response[0],countResponse[0][0]])
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    /**
     * 
     * @param {Object} objData {IDTaiKhoan, IDSanPham, IDPhuongThucThanhToan, SoLuong}
     * @returns object
     * Checkout không qua giỏ hàng
     */
    checkoutV1 = async (objData) => {
        if(!objData || Object.keys(objData).length === 0) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        try {
            // kiểm tra thông tin truyền vào
            const errors = []
            if(!objData.IDTaiKhoan) {
                errors.push('Thiếu thông tin tài khoản')
            }else {
                const user = await UserModel.get({DaXoa: 0, id: objData.IDTaiKhoan})
                if(!user || !user.data || !user.data[0]) {
                    throw new Error(user.message)
                }
                if(user.data[0].length === 0) {
                    errors.push('Tài khoản không hợp lệ')
                }
            }

            if(!objData.IDPhuongThucThanhToan) {
                errors.push('Thiếu phương thức thanh toán')
            }

            if(!objData.IDSanPham) {
                errors.push('Thiếu mã sản phẩm')
            }

            if(!objData.SoLuong) {
                errors.push('Thiếu số lượng sản phẩm cần mua')
            }
            if(errors.length > 0) {
                return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], errors)
            }

            // lấy thông tin product

            const objProductResponse = await ProductModel.getDetail({id: objData.IDSanPham})
            if(!objProductResponse.success) {
                return objProductResponse
            }

            const productDetail = objProductResponse.data

            productDetail.SoLuongSanPham = objData.SoLuong
            productDetail.PhiVanChuyen = 40000
            const MaDonHang = uniqid('DonHang-')

            const extraInfo = {
                IDTaiKhoan : objData.IDTaiKhoan,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan,
                MaDonHang
            }

            const resultCheckout = this._checkout({arrProduct:[productDetail], extraInfo})

            return resultCheckout
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    /**
     * 
     * @param {Object} objData {IDSanPham, SoLuong, IDPhuongThucThanhToan, Email, SoDienThoai, TinhThanh, QuanHuyen, PhuongXa, SoNha}
     */
    checkoutV2 = async (objData) => {
        if(!objData) {
            return ResponseUtil.response(false, 'tham số không hợp lệ')
        }
        const errors = []

        if(!objData.IDSanPham) {
            errors.push('Thiếu mã sản phẩm')
        }
        if(!objData.SoLuong) {
            errors.push('Thiếu số lượng sản phẩm')
        }
        if(!objData.IDPhuongThucThanhToan) {
            errors.push('Thiếu phương thức thanh toán')
        }
        if((!objData.Email || !objData.SoDienThoai || !objData.TinhThanh ||!objData.QuanHuyen ||!objData.PhuongXa || !objData.SoNha) && !objData.IDTaiKhoan) {
            errors.push('Thiếu thông tin đặt hàng')
        }

        if(errors.length >0) {
            return ResponseUtil.response(false, 'Thông tin đặt hàng không hợp lệ', [], errors)
        }

        try {
            const objProductResponse = await ProductModel.getDetail({id: objData.IDSanPham})
            if(!objProductResponse.success) {
                return objProductResponse
            }

            const productDetail = objProductResponse.data

            productDetail.SoLuongSanPham = objData.SoLuong
            productDetail.PhiVanChuyen = 40000
            const MaDonHang = uniqid('DonHang-')

            const extraInfo = {
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan,
                MaDonHang,
                MaChietKhau: objData.MaChietKhau
            }
            
            if(!objData.IDTaiKhoan) {
                const ThongTinDatHang = {
                    Email: objData.Email,
                    SoDienThoai: objData.SoDienThoai,
                    TinhThanh: objData.TinhThanh,
                    QuanHuyen: objData.QuanHuyen,
                    PhuongXa: objData.PhuongXa,
                    SoNha: objData.SoNha
                }
                const encryptInfo = JSON.stringify(ThongTinDatHang)
                extraInfo.ThongTinDatHang= encryptInfo
            } else {
                extraInfo.IDTaiKhoan = objData.IDTaiKhoan
            }
            
            const resultCheckout = this._checkout({arrProduct:[productDetail], extraInfo})

            return resultCheckout
        } catch (error) {
            
        }
    }
    /**
     * 
     * @param {object} objOrderData 
     * arrProduct = [{SoLuongSanPham: 1, PhiVanChuyen: 10000, GiaGoc}]
     * extraInfo = {IDTaiKhoan, IDPhuongThucThanhToan, PhuPhi, MaDonHang}
     */
    _checkout = async(objOrderData) => {
        var {arrProduct, extraInfo} = objOrderData
        try {
            var TongGiaTriDonHang = 0
            var TongPhiVanChuyen = 0
            var arrErrors = [] //Trả về các sản phẩm thêm thất bại
            var productCount = 0
            var discountFee = 0
            for (let index = 0; index < arrProduct.length; index++) {
                var objDetailProduct = arrProduct[index]
                if(objDetailProduct.SoLuong < objDetailProduct.SoLuongSanPham) {
                    arrErrors.push(`Hết Hàng ::${objDetailProduct.id}`)
                    arrProduct.splice(index, 1) // xóa khỏi danh sách mua hàng
                    continue
                }
                var itemPrice = objDetailProduct.GiaGoc * objDetailProduct.SoLuongSanPham + objDetailProduct.PhiVanChuyen
                TongGiaTriDonHang += itemPrice
                TongPhiVanChuyen += arrProduct[index].PhiVanChuyen
                arrProduct[index].ItemPrice = itemPrice
                productCount ++
            }

            if(productCount === 0) {
                return ResponseUtil.response(false, "Không có sản phẩm nào có thể đặt hàng", [], arrErrors)
            }
            //kiểm tra khuyến mại
            var isValidDiscount = true
            if(extraInfo.MaChietKhau) {
                const responseDiscount = await DiscountModel.get({MaChietKhau: extraInfo.MaChietKhau, DaXoa: 0, TrangThai:1, validTime: true})
                const discount = responseDiscount.data[0]
                if(!responseDiscount.success && responseDiscount.data.length === 0) {
                    isValidDiscount = false
                }else {
                    
                    if(discount.DieuKienGiaToiDa && TongGiaTriDonHang > discount.DieuKienGiaToiDa) {
                        isValidDiscount = false
                    }
                    if(discount.DieuKienGiaToiThieu && TongGiaTriDonHang < discount.DieuKienGiaToiThieu) {
                        isValidDiscount = false
                    }
                    if(discount.SoLuongSuDungToiDa) {
                        const responseOrderDiscount = await this.get({DaXoa:0, MaChietKhau: extraInfo.MaChietKhau})
                        if(responseOrderDiscount.success && responseOrderDiscount.data[1] && responseOrderDiscount.data[1].rowCount >= discount.SoLuongSuDungToiDa) {
                            isValidDiscount = false
                        }
                    }

                }
                if(isValidDiscount) {
                    if(discount.GiaTriChietKhau) {
                        discountFee = discount.GiaTriChietKhau
                    }else if(discount.PhanTramChietKhau) {
                        discountFee = discount.PhanTramChietKhau * TongGiaTriDonHang
                    }
                }
            }


            const objOrder = {
                IDPhuongThucThanhToan: extraInfo.IDPhuongThucThanhToan,
                ThoiGianTao: new Date().getTime()/1000,
                DaXoa: 0,
                TongGiaTriDonHang: TongGiaTriDonHang - discountFee,
                PhuPhi: extraInfo.PhuPhi ? extraInfo.PhuPhi : 0,
                TrangThai: 0,
                MaDonHang: extraInfo.MaDonHang,
                GiaVanChuyen: TongPhiVanChuyen,
                MaChietKhau: extraInfo.MaChietKhau,
                TongGiaTriChietKhau: discountFee
            }

            if(extraInfo.IDTaiKhoan) {
                objOrder.IDTaiKhoan = extraInfo.IDTaiKhoan
            }
            if(extraInfo.ThongTinDatHang) {
                objOrder.ThongTinDatHang = extraInfo.ThongTinDatHang
            }
            const responseOrder = await this.insert(objOrder)

            if(!responseOrder.success) {
                return responseOrder
            }

            //lấy id đơn hàng
            const orderInfo = await this.get({MaDonHang: extraInfo.MaDonHang})

            if(!orderInfo.success || !orderInfo.data || !orderInfo.data[0] || !orderInfo.data[0][0]) {
                return orderInfo
            }
            const objOrderInfo = orderInfo.data[0][0]

            for (let index = 0; index < arrProduct.length; index++) {
                var ThanhTien = objDetailProduct.GiaGoc * objDetailProduct.SoLuongSanPham + objDetailProduct.PhiVanChuyen
                //Trừ số lượng sản phẩm đi
                const updateProductResponse = await ProductModel.update({SoLuong: arrProduct[index].SoLuong - arrProduct[index].SoLuongSanPham, id: arrProduct[index].id})

                if(!updateProductResponse.success) {
                    arrErrors.push(`${updateProductResponse.message}::${arrProduct[index].id}`)

                    let dataUpdateOrder = {
                        TongGiaTriDonHang: objOrderInfo.TongGiaTriDonHang - ThanhTien
                    }
                    let updateResponse = await this.update(dataUpdateOrder, {id: objOrderInfo.id})

                    if(!updateResponse.success) {
                        throw new Error(updateResponse.message)
                    }
                    continue
                }

                // insert order item
                let orderItem = {
                    IDSanPham: arrProduct[index].id,
                    IDDonHang: objOrderInfo.id,
                    ThoiGianTao: new Date().getTime()/1000,
                    SoLuong: arrProduct[index].SoLuongSanPham,
                    DonGia: arrProduct[index].GiaGoc,
                    ThanhTien: ThanhTien,
                    PhiVanChuyen: arrProduct[index].PhiVanChuyen
                }

                const responseItemOrder = await OrderDetailModel.insert(orderItem)

                // nếu thêm thất bại thì chỉnh lại đơn hàng
                if(!responseItemOrder.success) {
                    arrErrors.push(`${responseItemOrder.message}::${arrProduct[index].id}`)

                    let dataUpdateOrder = {
                        TongGiaTriDonHang: objOrderInfo.TongGiaTriDonHang - ThanhTien
                    }
                    let updateResponse = await this.update(dataUpdateOrder, {id: objOrderInfo.id})

                    if(!updateResponse.success) {
                        throw new Error(updateResponse.message)
                    }
                }
            }

            return ResponseUtil.response(true, 'Thành công', [], arrErrors)
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    /**
     * checkout qua giỏ hàng khi chưa đăng nhập
     * @param {Ojbect} objData 
     * 
     */
    checkoutV3 = async (objData) => {
        if(!objData) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        const errors = []

        if(!objData.IDGioHang) {
            errors.push('Thiếu thông tin giỏ hàng')
        }
        if(!objData.IDPhuongThucThanhToan) {
            errors.push('Thiếu phương thức thanh toán')
        }
        if(!objData.IDSanPham) {
            errors.push('Thiếu thông tin sản phẩm cần thanh toán')
        }
        if((!objData.Email || !objData.SoDienThoai || !objData.TinhThanh || !objData.QuanHuyen || !objData.PhuongXa || !objData.SoNha) && !objData.IDTaiKhoan) {
            errors.push('Thiếu thông tin khách hàng')
        }

        if(errors.length >0) {
            return ResponseUtil.response(false, 'Thiếu thông tin cần thiết', [], errors)
        }

        try {
            //lấy ra cart và cartItem
            const dataCartResponse = await CartModel.getCart({id: objData.IDGioHang})
            const dataCartItemResponse = await CartItemModel.getListCartItem({IDGioHang: objData.IDGioHang, IDSanPham: objData.IDSanPham})

            if(!dataCartResponse.success || dataCartResponse.data.length === 0 || !dataCartItemResponse.success || dataCartItemResponse.data.length === 0) {
                return ResponseUtil.response(false, 'Lấy thông tin giỏ hàng thất bại, hoặc không có sản phẩm nào trong giỏ hàng')
            }
            // Lấy thông tin tất cả sản phẩm
            const dataProductResponse = await ProductModel.get({id: objData.IDSanPham})

            if(!dataProductResponse || !dataProductResponse.success || !dataCartItemResponse.data.length === 0) {
                return ResponseUtil.response(false, 'Không lấy được thông tin sản phẩm')
            }

            const arrProduct = dataProductResponse.data
            const arrCartItem= dataCartItemResponse.data

            // lặp qua tất cả sản phẩm để gắn thêm tham số cần thiết cho tính toán
            for (let index = 0; index < arrProduct.length; index++) {
                for (let indexCartItem = 0; indexCartItem < arrCartItem.length; indexCartItem++) {
                    if(arrProduct[index].id === arrCartItem[indexCartItem].IDSanPham) {
                        arrProduct[index].SoLuongSanPham = arrCartItem[indexCartItem].SoLuong
                        arrProduct[index].PhiVanChuyen = 40000 
                    }
                    
                }
            }

            // thông tin đăt hàng
            const MaDonHang = uniqid('DonHang-')
            const extraInfo = {
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan,
                MaDonHang,
                MaChietKhau: objData.MaChietKhau
            }
            if(!objData.IDTaiKhoan) {
                const ThongTinDatHang = {
                    Email: objData.Email,
                    SoDienThoai: objData.SoDienThoai,
                    TinhThanh: objData.TinhThanh,
                    QuanHuyen: objData.QuanHuyen,
                    PhuongXa: objData.PhuongXa,
                    SoNha: objData.SoNha
                }
                const encryptInfo = JSON.stringify(ThongTinDatHang)
                extraInfo.ThongTinDatHang = encryptInfo
            } else {
                extraInfo.IDTaiKhoan = objData.IDTaiKhoan
            }
            

            const resultCheckout =await this._checkout({arrProduct: arrProduct, extraInfo})

            //thêm thành công thì xóa những sản phẩm vừa đặt hàng thành công, giữ lại những sản phẩm thất bại

            if(resultCheckout.success) {
                const arrListIDSanPham = objData.IDSanPham.split(',') 
                if(resultCheckout.error.length > 0) {
                    const arrListIDSanPhamFail = []
                    for (let index = 0; index < resultCheckout.error.length; index++) {
                        let strIDSanPham = resultCheckout.error[index].split('::')[1]
                        arrListIDSanPhamFail.push(strIDSanPham)
                    }

                    for (let index = 0; index < arrListIDSanPham.length; index++) {
                        for (let indexFail = 0; indexFail < arrListIDSanPhamFail.length; indexFail++) {
                            if(arrListIDSanPham[index]/1 === arrListIDSanPhamFail[index]/1) {
                                arrListIDSanPham.splice(index, 1)
                            }
                        }
                    }
                }
                const listID = arrListIDSanPham.join(',')
                if(listID) {
                    const removeCartItemResponse = await CartModel.removeFromCart({IDSanPham: listID, IDGioHang: objData.IDGioHang})
                }
            }
            return resultCheckout
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    insert = async(objOrder) => {
        try {
            const strField = buildFieldQuery(objOrder)
            const strValue = _buildInsertField(strField, objOrder)

            const query = `insert into ${this.table}(${strField}) values(?)`

            const response = await DBConnection.query(query, [strValue])

            if(!response || !response[0]) {
                return ResponseUtil.response(false, 'Không thể kết nối database')
            }

            if(response[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thêm dữ liệu thất bại')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    update = async (objData, objCondition) => {
        if(!objData || !objCondition) {
            return ResponseUtil.response(false, 'Sửa thất bại')
        } 

        try {
            var objOrder = {
                IDTaiKhoan: objData.IDTaiKhoan ? objData.IDTaiKhoan : undefined,
                IDPhuongThucThanhToan: objData.IDPhuongThucThanhToan ? objData.IDPhuongThucThanhToan : undefined,
                ThoiGianCapNhat: new Date().getTime()/1000,
                DaXoa: objData.DaXoa ? objData.DaXoa : undefined,
                TongGiaTriDonHang: objData.TongGiaTriDonHang ? objData.TongGiaTriDonHang : undefined,
                PhuPhi: objData.PhuPhi ? objData.PhuPhi : undefined,
                TrangThai: objData.TrangThai ? objData.TrangThai : undefined,
                GiaVanChuyen: objData.GiaVanChuyen ? objData.GiaVanChuyen : undefined
            }

            objOrder = object_filter(objOrder) // bỏ đi những trường undefined

            const query = `update ${this.table} set ? where ?`

            const response = await DBConnection.query(query, [objOrder, objCondition])

            if(!response || !response[0]) {
                return ResponseUtil.response(false, 'Không thể kết nối database')
            }

            if(response[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Sửa thông tin thất bại')
            }

            return ResponseUtil.response(true, 'Thành công')
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

        if(objCondition.hasOwnProperty("DaXoa")) {
            strWhere += ` and ${table}.DaXoa = ${objCondition.DaXoa} `
        }

        if(objCondition.hasOwnProperty("TrangThai")) {
            strWhere += ` and ${table}.TrangThai = ${objCondition.TrangThai}`
        }

        if(objCondition.exported_warehouse) {
            strWhere += ` and ${table}.TrangThai > 1`
        }

        if(objCondition.MaDonHang) {
            strWhere += ` and ${table}.MaDonHang = '${objCondition.MaDonHang}'`
        }
        if(objCondition.MaChietKhau) {
            strWhere += ` and ${table}.MaChietKhau = '${objCondition.MaChietKhau}'` 
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

module.exports = new OrderModel()