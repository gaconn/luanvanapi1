const productRouter = require("./product")
const userRouter = require("./user")
const supplierRouter = require("./supplier")
const categoryRouter = require("./category")
const orderRouter = require('./order')
const cartRouter = require('./cart')
const cartItemRouter = require('./cartItem')
const permissionRouter = require('./permission')
const orderExchangeRouter = require('./orderExchange')
const discountRouter = require('./discount')
function routes(app) {
    app.use("/product", productRouter)
    app.use("/user", userRouter)
    app.use("/supplier", supplierRouter)
    app.use("/category", categoryRouter)
    app.use("/order", orderRouter)
    app.use("/cart", cartRouter)
    app.use("/cart-item", cartItemRouter)
    app.use("/permission", permissionRouter)
    app.use("/order-exchange", orderExchangeRouter)
    app.use("/discount", discountRouter)
}

module.exports = routes