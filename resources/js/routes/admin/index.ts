import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import products from './products'
import orders from './orders'
import notifications from './notifications'
/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\DashboardController::dashboard
* @see app/Http/Controllers/Admin/DashboardController.php:13
* @route '/admin'
*/
dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

dashboard.form = dashboardForm

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
export const financials = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: financials.url(options),
    method: 'get',
})

financials.definition = {
    methods: ["get","head"],
    url: '/admin/financials',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
financials.url = (options?: RouteQueryOptions) => {
    return financials.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
financials.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: financials.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
financials.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: financials.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
const financialsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: financials.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
financialsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: financials.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::financials
* @see app/Http/Controllers/Admin/OrderController.php:43
* @route '/admin/financials'
*/
financialsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: financials.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

financials.form = financialsForm

const admin = {
    dashboard: Object.assign(dashboard, dashboard),
    products: Object.assign(products, products),
    orders: Object.assign(orders, orders),
    financials: Object.assign(financials, financials),
    notifications: Object.assign(notifications, notifications),
}

export default admin