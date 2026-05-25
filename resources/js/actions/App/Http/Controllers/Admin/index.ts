import DashboardController from './DashboardController'
import ProductController from './ProductController'
import OrderController from './OrderController'
import NotificationController from './NotificationController'

const Admin = {
    DashboardController: Object.assign(DashboardController, DashboardController),
    ProductController: Object.assign(ProductController, ProductController),
    OrderController: Object.assign(OrderController, OrderController),
    NotificationController: Object.assign(NotificationController, NotificationController),
}

export default Admin