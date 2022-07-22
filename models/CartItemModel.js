const { _buildSelect, buildFieldQuery, _buildInsertField } = require("../utils/DBUtil")
const ResponseUtil = require("../utils/ResponseUtil")
const DBConnection = require("./DBConnection")

class CartItemModel {
    constructor() {
        this.table = 'chitietgiohang'
    }
    getListCartItem = async (objData) => {
        const errors  = []
        if(!objData.IDGioHang) {
            errors.push('Thông tin giỏ hàng không hợp lệ')
        }

        if(errors.length > 0) {
            return ResponseUtil.response(false, 'Thông tin không hợp lệ', [], errors)
        }

        try {
            var strSelect = 'select 1'
            strSelect += _buildSelect(['*'], this.table)
            var strJoin = ''

            if(objData.joinProduct) {
                strJoin += ` left join sanpham on ${this.table}.IDSanPham = sanpham.id`
                let field = [
                    'Ten',
                    'HinhAnh',
                    'MoTa',
                    'IDTheLoai',
                    'IDNhaCungCap',
                    'GiaGoc'
                ]
                strSelect += _buildSelect(field, 'sanpham', 'SanPham')
            }

            var strWhere = this._buildWhereQuery(objData)

            const query = `${strSelect} from ${this.table} ${strJoin} ${strWhere}`

            const result = await DBConnection.query(query)

            if(!result || !result[0]) {
                throw new Error('Không thể kết nối database')
            }
            return ResponseUtil.response(true, 'Thành công', result[0])
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    update = async (objData) => {
        var errors = []
        if(!objData.IDSanPham) {
            errors.push('Thiếu thông tin sản phẩm')
        }

        if(errors.length >0) {
            return ResponseUtil.response(false, 'Thông tin cập nhật không chính xác')
        }

        try {
            var objValue = {
                SoLuong: objData.SoLuong,
                ThoiGianCapNhat: new Date().getTime()/1000
            }

            var strWhere = this._buildWhereQuery(objData)
            const query = `update ${this.table} set ? ${strWhere}`

            const result = await DBConnection.query(query, [objValue])

            if(!result && !result[0]) {
                throw new Error('Không thể kết nối tới database')
            }
            if(result[0].affectedRows === 0 ){
                return ResponseUtil.response(false, 'Cập nhật thất bại')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    insert = async (objData) => {
        const errors = []
        if(!objData.IDSanPham) {
            errors.push('Thiếu mã sản phẩm')
        }
        if(!objData.SoLuong) {
            errors.push('Thiếu số lượng sản phẩm muốn thêm')
        }
        if(!objData.IDGioHang) {
            errors.push('Thiếu thông tin giỏ hàng')
        }

        if(errors.length > 0) {
            return ResponseUtil.response(false, 'Dữ liệu không hợp lệ', [], errors)
        }
        try {
            var objValues = {
                IDSanPham: objData.IDSanPham,
                IDGioHang: objData.IDGioHang,
                SoLuong: objData.SoLuong,
                ThoiGianTao: new Date().getTime()/1000
            }

            var strField = buildFieldQuery(objValues)
            var values = _buildInsertField(strField, objValues)

            const query = `insert into ${this.table}(${strField}) values(${values})`

            const result = await DBConnection.query(query)

            if(!result || !result[0]) {
                throw new Error('Không thể kết nối tới database')
            }
            if(result[0].affectedRows ===0) {
                return ResponseUtil.response(false, 'Thêm thất bại')
            }
            return ResponseUtil.response(true, 'Thành công')
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    remove = async (objData) => {
        if(!objData || !objData.IDGioHang) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }

        try {
            const strWhere = this._buildWhereQuery(objData)
            const query = `delete from ${this.table} ${strWhere}`
            const result = await DBConnection.query(query)
            if(!result || !result[0]) {
                throw new Error('Kết nối database không thành công')
            }
            if(result[0].affectedRows ===0) {
                return ResponseUtil.response(false, 'Xóa sản phẩm thất bại')
            }

            return ResponseUtil.response(true, 'Thành công', [{affectedRows:result[0].affectedRows}])
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
    _buildWhereQuery = (objData) => {
        var strWhere = ' where 1=1 '
        if(objData.id) {
            var arrIDItem = objData.id.split(',')
            if(arrIDItem.length >0) {
                strWhere += ` and (1=0 `
                for (let index = 0; index < arrIDItem.length; index++) {        
                    strWhere += ` or ${this.table}.id = ${arrIDItem[index]}`
                }
                strWhere += ` )`
            }
        }
        if(objData.IDGioHang) {
            strWhere += ` and ${this.table}.IDGioHang = ${objData.IDGioHang}`
        }
        if(objData.IDSanPham) {
            var arrIDSanPham = (objData.IDSanPham+"").split(',')
            if(arrIDSanPham.length >0) {
                strWhere += ` and (1=0 `
                for (let index = 0; index < arrIDSanPham.length; index++) {        
                    strWhere += ` or ${this.table}.IDSanPham = ${arrIDSanPham[index]}`
                }
                strWhere += ` )`
            }
        }
        return strWhere
    }
}

module.exports = new CartItemModel()