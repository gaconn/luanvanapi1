const CartModel = require("../models/CartModel")
const ResponseUtil = require("../utils/ResponseUtil")

class CartController {
    getCart = async (req, res) => {
        const condition = req.query 
        try {
            const response = await CartModel.getCart(condition)
            if(!response) {
                throw new Error('Lỗi kết nối')
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }
    /**
     * Method: post
     * url: /cart/add-to-cart  
     *  {IDSanPham, SoLuong, IDTaiKhoan || SessionID}
     */
    addToCart = async (req, res) => {
        const data = req.body
        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }

        try {
            const response = await CartModel.addToCart(data)

            if(!response) {
                throw new Error()
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }
    /**
     * Method: delete
     * url :/cart/remove-cart-item
     * params: 
     * + IDGioHang : nếu muốn xóa tất cả sản phẩm trong giỏ hàng thì chỉ truyền vào cái này thôi !
     * + IDSanPham : truyền thêm cái này để xóa 1 sản phẩm trong giỏ hàng, muốn xóa nhiều cái cùng lúc thì truyền id cách nhau bằng dấu phẩy vd (1,2,3)
     *
     */
    removeCartItem = async (req, res) => {
        const data = req.query

        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }
        try {
            const response = await CartModel.removeFromCart(data)

            if(!response) {
                throw new Error('Không thể kết nối database')
            }
            return res.json(response)
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }

    updateCart = async (req, res) => {
        
    }
    /**
     * method: PUT
     * url: /cart/update-cart-item
     *  params:
     * + IDGioHang 
     * + IDSanPham : sản phẩm cần update
     * + SoLuong: SoLuong sản phẩm trong giỏ hàng
     */
    updateCartItem = async(req, res) => {
        const data = req.body

        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }

        try {
            const response = await CartModel.updateCartItem(data)

            if(!response) {
                throw new Error('Không thể kết nối database')
            }
            return res.json(response)
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
}

module.exports = new CartController()