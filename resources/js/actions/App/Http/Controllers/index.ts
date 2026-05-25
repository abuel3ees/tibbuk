import StoreController from './StoreController'
import OrderController from './OrderController'
import Admin from './Admin'
import Settings from './Settings'

const Controllers = {
    StoreController: Object.assign(StoreController, StoreController),
    OrderController: Object.assign(OrderController, OrderController),
    Admin: Object.assign(Admin, Admin),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers