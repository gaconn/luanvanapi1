const LadingModel = require("../models/LadingModel")
const OrderDetailModel = require("../models/OrderDetailModel")
const OrderModel = require("../models/OrderModel")
const ResponseUtil = require("../utils/ResponseUtil")

class OrderController {
    /**
     * Method: GET
     * /order/get-orders
     */

    getOrder = async(req, res) => {
        const objData = req.query
        try {
            const objCondition = {
                ...objData,
                joinUser: true,
                joinPaymentMethod: true,
            }

            const orders =await OrderModel.get(objCondition)

            if(!orders) {
                throw new Error('Lỗi hệ thống')
            }

            return res.json(orders)

        } catch (error) {   
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

    getOrderDetail = async (req, res) => {
        const data =req.query
        try {
            const condition = {
                ...data,
                joinOrder: true,
                joinProduct: true,
            }
            const response = await OrderDetailModel.get(condition) 

            if(!response) {
                throw new Error('Không thể kết nối')
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }
    /**
     * Method: POST
     * /order/checkout-v1
     */

    checkoutV1 = async(req, res) => {
        const data = req.body
        try {
            const response = await OrderModel.checkoutV1(data)

            if(!response) {
                throw new Error('Lỗi hệ thống')
            }

            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

    /**
     * Checkout trực tiếp không qua giỏ hàng, không cần đăng nhập
     * Method POST
     * /order/checkout-v2 
     */
    checkoutV2 = async (req, res) => {
        const data = req.body
        if(!data) {
            return ResponseUtil.response(false, 'Tham số không hợp lệ')
        }
        try {
            const checkoutResponse = await OrderModel.checkoutV2(data)

            if(!checkoutResponse) {
                throw new Error('Không thể sử lý')
            }
            return res.json(checkoutResponse)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

    /**
     * Checkout qua giỏ hàng khi chưa đăng nhập
     * Method: POST
     * url: order/checkout-v3
     * params: 
     * + Thông tin => Email, SoDienThoai, TinhThanh, QuanHuyen, PhuongXa, SoNha
     * + IDGioHang
     * + IDSanPham : có thể truyền 1 hoặc nhiều vd 1,2,3
     * + IDPhuongThucThanhToan: cái này tự thêm database trước, id = 1 là thanh toán khi nhận hàng, id=2 là thanh toán qua momo.
     */

    checkoutV3 = async (req, res) => {
        const data = req.body
        // const emailUser = req.emailUser
        // if(!emailUser) {
        //     return res.json(ResponseUtil.response(false, 'Vui lòng đăng nhập để sử dụng'))
        // }

        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }

        try {
            const response = await OrderModel.checkoutV3(data)
            if(!response) {
                throw new Error('Lỗi xử lý')
            }
            return res.json(response)
        } catch (error) {
            return res.json(false, error.message)
        }
    }

    checkout = async (req,res) => {
        const data = req.body
        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hợp lệ'))
        }

        try {
            var response 
            if(data.IDSanPham && !data.IDGioHang) {
                //chưa thêm giỏ hàng
                //tham số {IDSanPham, SoLuong, IDPhuongThucThanhToan, (Email, SoDienThoai, TinhThanh, QuanHuyen, PhuongXa, SoNha) || IDTaiKhoan}
                response = await OrderModel.checkoutV2(data)
            } else if( data.IDSanPham && data.IDGioHang) {
                //đã thêm sản phẩm vào giỏ hàng
                // tham số {IDSanPham, IDPhuongThucThanhToan (Email, SoDienThoai, TinhThanh, QuanHuyen, PhuongXa, SoNha) || IDTaiKhoan}
                response = await OrderModel.checkoutV3(data)
            } 

            if(!response) {
                throw new Error('Không thể kết nối database')
            }

            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

    /**
     * Method: put
     * url: order/change-status
     * params: {id, TrangThai}
     */
    changeStatus = async (req, res)=> {
        const data= req.body
        if(!data) {
            return res.json(ResponseUtil.response(false, 'Tham số không hơp lệ'))
        }

        if(!data.id || !data.TrangThai) {
            return res.json(ResponseUtil.response(false, 'Dữ liệu không hợp lệ'))
        }
        try {
            if(data.TrangThai *1 === 2) {
                // kiểm tra xem đã có vận đơn cho đơn này chưa
                const responseLading = await LadingModel.get({IDDonHang: data.id})
                if(!responseLading ) {
                    throw new Error('')
                }
                if(responseLading.data.length === 0) {
                    const responseCreateLading = await LadingModel.insert({IDDonHang: data.id})
                    if(!responseCreateLading || !responseCreateLading.success) {
                        return res.json(responseCreateLading)
                    }
                }
            }

            if(data.TrangThai*1 === 3) {
                // vận chuyển xong thì cập nhật
                const responseLading = await LadingModel.get({IDDonHang: data.id})
                if(!responseLading ) {
                    throw new Error('')
                }
                if(responseLading.data.length > 0) {
                    const responseCreateLading = await LadingModel.update({TrangThai: 1},{IDDonHang: data.id})
                    if(!responseCreateLading || !responseCreateLading.success) {
                        return res.json(responseCreateLading)
                    }
                }
            }
            const response = await OrderModel.update(data, {id: data.id})
            if(!response) {
                throw new Error('Không thể kết nối với database')
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }
}

module.exports = new OrderController()