const { _buildSelect, object_filter, buildFieldQuery, _buildInsertField } = require("../utils/DBUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const CartItemModel = require("./CartItemModel")
const DBConnection = require("./DBConnection")

class CartModel {
    constructor () {
        this.table = 'giohang'
    }

    addToCart = async(objData) => {
        const errors = []
        if(!objData.IDTaiKhoan && !objData.SessionID) {
            errors.push('Thiếu thông tin khách hàng')
        }
        if(!objData.IDSanPham) {
            errors.push('Thông tin sản phẩm không được bỏ trống')
        }
        if(!objData.SoLuong) {
            errors.push('Số lượng sản phẩm thêm vào giỏ hàng không được bỏ trống')
        }

        if(errors.length !== 0) {
            return ResponseUtil.response(false, 'Thông tin không hợp lệ', [], errors)
        }
        try {
            //get cart
            var conditionGetCart = {
                IDTaiKhoan: objData.IDTaiKhoan ? objData.IDTaiKhoan : undefined,
                SessionID : objData.SessionID ? objData.SessionID : undefined
            }
            conditionGetCart = object_filter(conditionGetCart)

            const cartDataExist = await this.getCart(conditionGetCart)

            if(!cartDataExist ||!cartDataExist.success) {
                throw new Error('Không lấy được dữ liệu giỏ hàng')
            }

            var intIDCart = 0
            var isNew = false
            if(cartDataExist.data.length === 0) {
                isNew = true
                //Giỏ hàng không tồn tại thì thêm giỏ mới
                var objDataCart = {
                    SoLuongDanhMuc: 0,
                    SoLuongSanPham: 0,
                    IDTaiKhoan: objData.IDTaiKhoan ? objData.IDTaiKhoan : undefined,
                    SessionID : objData.SessionID ? objData.SessionID : undefined
                }

                objDataCart = object_filter(objDataCart)

                const resultInsert = await this.addCart(objDataCart)

                if(!resultInsert || !resultInsert.success) {
                    throw new Error('Không thể thêm cart')
                }

                // thêm xong thì lấy cart id để xử lý
                var conditionGetCart = {
                    IDTaiKhoan: objData.IDTaiKhoan ? objData.IDTaiKhoan : undefined,
                    SessionID : objData.SessionID ? objData.SessionID : undefined
                }
                conditionGetCart = object_filter(conditionGetCart)
    
                const cartData = await this.getCart(conditionGetCart)
    
                if(!cartData ||!cartData.success) {
                    throw new Error('Không lấy được dữ liệu giỏ hàng')
                }

                if(cartData.data[0]) {
                    intIDCart = cartData.data[0].id
                }
            } else {
                intIDCart = cartDataExist.data[0].id
            }

            // Kiểm tra cart đã có item hay chưa
            var conditionGetCartItem = {
                IDGioHang : intIDCart,
                IDSanPham: objData.IDSanPham
            }
            conditionGetCartItem = object_filter(conditionGetCartItem)
            const dataCartItem = await CartItemModel.getListCartItem(conditionGetCartItem)

            if(!dataCartItem || !dataCartItem.success) {
                throw new Error('Không lấy được dữ liệu giỏ hàng')
            }
            //có rồi thì cập nhật số lượng của sản phẩm đó
            if(dataCartItem.data.length >0) {
                var sl = dataCartItem.data[0].SoLuong + objData.SoLuong/1 
                const resultUpdateCartItem = await CartItemModel.update({IDSanPham: objData.IDSanPham, SoLuong: sl, id: dataCartItem.data[0].id})
                //thành công thì update giỏ hàng
                if(resultUpdateCartItem && resultUpdateCartItem.success) {
                    var slsp = 1
                    if(!isNew) {
                        slsp += cartDataExist.data[0].SoLuongSanPham
                    } 
                    await this.update({id: intIDCart, SoLuongSanPham: slsp})
                }
                return resultUpdateCartItem 
            }else {
                // chư có thì thêm mới
                var conditionInsertCartItem = {
                    IDSanPham : objData.IDSanPham,
                    IDGioHang : intIDCart,
                    SoLuong : objData.SoLuong,
                }

                const resultInsertCartItem = await CartItemModel.insert(conditionInsertCartItem)
                if(resultInsertCartItem && resultInsertCartItem.success) {
                    var slsp = 1
                    var sldm = 1
                    if(!isNew) {
                        slsp += cartDataExist.data[0].SoLuongSanPham
                        sldm += cartDataExist.data[0].SoLuongDanhMuc
                    } 
                    await this.update({id: intIDCart, SoLuongSanPham: slsp, SoLuongDanhMuc : sldm})
                }
                return resultInsertCartItem
            }
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    getCart = async (condition) => {
        try {
            var strSelect = 'select 1 '
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ''
            if(condition.joinCartItem) {
                strJoin += ` left join chitietgiohang on ${this.table}.id = chitietgiohang.IDGioHang`
                strSelect += _buildSelect(['IDSanPham', 'SoLuong', 'ThoiGianTao'], 'chitietgiohang', 'ChiTietGioHang_')
            }

            var strWhere = this._buildWhereQuery(condition)

            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`

            const result = await DBConnection.query(query)

            if(!result || !result[0]) {
                throw new Error('Không thể kết nối tới database')
            }

            return ResponseUtil.response(true, 'Thành công', result[0])
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    addCart = async (objData) => {
        if(!objData) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ')
        }

        try {
            var objDataInsert = {
                SoLuongDanhMuc: objData.SoLuongDanhMuc ? objData.SoLuongDanhMuc : 0,
                SoLuongSanPham: objData.SoLuongSanPham ? objData.SoLuongSanPham : 0,
                ThoiGianTao: new Date().getTime()/1000,
                IDTaiKhoan: objData.IDTaiKhoan ? objData.IDTaiKhoan : undefined,
                SessionID : objData.SessionID ? objData.SessionID : undefined
            }

            const field = buildFieldQuery(objDataInsert)
            const value = _buildInsertField(field, objDataInsert)
            const query = `insert into ${this.table}(${field}) values(?)`

            const result = await DBConnection.query(query, [value])

            if(!result || !result[0] ) {
                throw new Error('Không thể kết nối tới database')
            }
            if(result[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thất bại')
            } 
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    update = async (objData) => {
        if(!objData.id) {
            return ResponseUtil.response(false, 'Thiếu mã giỏ hàng')
        }
        try {
            var objValues = {
                SoLuongDanhMuc: objData.SoLuongDanhMuc ? objData.SoLuongDanhMuc : undefined,
                SoLuongSanPham: objData.SoLuongSanPham ? objData.SoLuongSanPham : undefined,
                ThoiGianCapNhat: new Date().getTime()/1000
            }

            objValues = object_filter(objValues)
            const query = `update ${this.table} set ? where ?`

            const result = await DBConnection.query(query, [objValues, {id: objData.id}])

            if(!result || !result[0]) {
                throw new Error('Không thể kết nối database')
            }
            if(result[0].affectedRows === 0) {
                return ResponseUtil.response(false, 'Thêm thất bại')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    removeFromCart = async (objCondition) => {
        if(!objCondition) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        const errors = []
        if(!objCondition.IDGioHang) {
            errors.push('Thiếu mã giỏ hàng')
        }

        if(errors.length >0) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ', [], errors)
        }
        try {
            //lấy thông tin giỏ hàng
            const cartDataResponse = await this.getCart(objCondition)
            if(!cartDataResponse || !cartDataResponse.success || cartDataResponse.data.length === 0) {
                return cartDataResponse
            }
            
            // xóa cartItem
            const deleteDataResponse = await CartItemModel.remove(objCondition)

            if(!deleteDataResponse || !cartDataResponse.success) {
                return ResponseUtil.response(false, 'Xóa thất bại')
            }
            // lấy lại thông tin cart item hiện tại
            const dataCartItem = await CartItemModel.getListCartItem({IDGioHang: objCondition.IDGioHang})
            var countItem = 0
            var quantity = 0
            if(dataCartItem && dataCartItem.data.length > 0) {
                for (let index = 0; index < dataCartItem.data.length; index++) {
                    countItem ++
                    quantity += dataCartItem.data[index].SoLuong
                }
            }
            // xóá thành công thì update cart
            const updateCartData = {
                SoLuongDanhMuc: countItem,
                SoLuongSanPham: quantity,
                id: objCondition.IDGioHang
            }
            const updateCartResponse = await this.update(updateCartData)
            return updateCartResponse 
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    updateCartItem = async (objData) => {
        if(!objData || !objData.IDGioHang || !objData.IDSanPham) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        try {
            //lấy thông tin giỏ hàng
            const cartDataResponse = await this.getCart(objData)
            if(!cartDataResponse || !cartDataResponse.success || cartDataResponse.data.length === 0) {
                return cartDataResponse
            }

            const cartItemUpdateResponse = await CartItemModel.update(objData)
            if(!cartItemUpdateResponse || !cartItemUpdateResponse.success) {
                return cartItemUpdateResponse
            }
            // lấy lại thông tin cart item hiện tại
            const dataCartItem = await CartItemModel.getListCartItem({IDGioHang: objData.IDGioHang})
            var countItem = 0
            var quantity = 0
            if(dataCartItem && dataCartItem.data.length > 0) {
                for (let index = 0; index < dataCartItem.data.length; index++) {
                    countItem ++
                    quantity += dataCartItem.data[index].SoLuong
                }
            }
            // sửa thành công thì update cart
            const updateCartData = {
                SoLuongDanhMuc: countItem,
                SoLuongSanPham: quantity,
                id: objData.IDGioHang
            }
            const updateCartResponse = await this.update(updateCartData)

            return updateCartResponse
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    _buildWhereQuery = (condition) => {
        var strWhere = ' where 1=1 '
        if(condition.id) {
            strWhere += ` and ${this.table}.id = ${condition.id}`
        }
        
        if(condition.IDTaiKhoan) {
            strWhere += ` and ${this.table}.IDTaiKhoan = ${condition.IDTaiKhoan}`
        }

        if(condition.SessionID && !condition.IDTaiKhoan) {
            strWhere += ` and ${this.table}.SessionID = '${condition.SessionID}'`
        }
        return strWhere
    }
}

module.exports = new CartModel()