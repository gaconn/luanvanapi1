const DiscountModel = require("../models/DiscountModel")
const ResponseUtil = require("../utils/ResponseUtil")

class DiscountController {
    /**
     * method: GET
     * url : discount/get-list
     */
    getList = async (req, res) => {
        const condition = req.query
        try {
            const response = await DiscountModel.get(condition)

            if(!response) {
                throw new Error('Không thể kết nối database')
            }
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false,error.message))
        }
    }

    /**
     * method: POST
     * url: discount/insert
     */
    insert = async (req, res) => {
        const data= req.body
        try {
            const response = await DiscountModel.insert(data)
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error))
        }
    }

    /**
     * method: PUT
     * url: discount/update
     */
    update = async (req, res) => {
        const data = req.body
        if(!data) {
            return res.json(ResponseUtil.response(false, 'dữ liệu không hợp lệ'))
        }
        try {
            const response = await DiscountModel.update(data, data.id)
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }

    /**
     * method: DELETE
     * url: discount/delete
     */
    delete = async (req, res) => {
        const id = req.query.id
        if(!id) {
            return res.json(ResponseUtil.response(false, 'id không hợp lệ'))
        }

        try {
            const response = await DiscountModel.delete(id)
            return res.json(response)
        } catch (error) {
            return res.json(ResponseUtil.response(false, error.message))
        }
    }
}

module.exports = new DiscountController()