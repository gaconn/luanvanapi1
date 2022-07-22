const CartItemModel = require("../models/CartItemModel");
const ResponseUtil = require("../utils/ResponseUtil");

class CartItemController {
    /**
     * Method: get
     * url: /cart-item/get-all
     * @returns Tất cả sản phẩm trong cart
     * param:
     * + IDGioHang : truyền vô nếu biết IDGioHang -> không truyền vô lỗi ráng chịu
     */
    getAll = async (req, res) => {
        const data = req.query
        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }
        try {
            const objCondition = {
                ...data,
                joinProduct: true
            }
            const response = await CartItemModel.getListCartItem(objCondition);
            if(!response) {
                throw new Error('Xử lý thất bại')
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

}

module.exports = new CartItemController()