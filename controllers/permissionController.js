const PermissionModel = require("../models/PermissionModel")

class PermissionController {
    /**
     * Method: get
     * /permission/get-list
     */
    getList = async (req, res) => {
        const data = req.body
        try {
            const condition = {
                ...data,
                TrangThai: 1
            }
            const response = await PermissionModel.get(condition)
            if(!response) {
                throw new Error('Không thể kết nối đến database')
            }
            return res.json(response)
        } catch (error) {
            return ResponseUtil.response(false, error.message)
        }
    }
}

module.exports = new PermissionController()