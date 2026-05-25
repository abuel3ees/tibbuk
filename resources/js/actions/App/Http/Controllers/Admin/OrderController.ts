import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/orders',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::index
* @see app/Http/Controllers/Admin/OrderController.php:14
* @route '/admin/orders'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
export const show = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/orders/{order}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
show.url = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        order: typeof args.order === 'object'
        ? args.order.id
        : args.order,
    }

    return show.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
show.get = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
show.head = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
const showForm = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
showForm.get = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::show
* @see app/Http/Controllers/Admin/OrderController.php:25
* @route '/admin/orders/{order}'
*/
showForm.head = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Admin\OrderController::updateStatus
* @see app/Http/Controllers/Admin/OrderController.php:32
* @route '/admin/orders/{order}/status'
*/
export const updateStatus = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(args, options),
    method: 'patch',
})

updateStatus.definition = {
    methods: ["patch"],
    url: '/admin/orders/{order}/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\OrderController::updateStatus
* @see app/Http/Controllers/Admin/OrderController.php:32
* @route '/admin/orders/{order}/status'
*/
updateStatus.url = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { order: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        order: typeof args.order === 'object'
        ? args.order.id
        : args.order,
    }

    return updateStatus.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OrderController::updateStatus
* @see app/Http/Controllers/Admin/OrderController.php:32
* @route '/admin/orders/{order}/status'
*/
updateStatus.patch = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::updateStatus
* @see app/Http/Controllers/Admin/OrderController.php:32
* @route '/admin/orders/{order}/status'
*/
const updateStatusForm = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\OrderController::updateStatus
* @see app/Http/Controllers/Admin/OrderController.php:32
* @route '/admin/orders/{order}/status'
*/
updateStatusForm.patch = (args: { order: number | { id: number } } | [order: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateStatus.form = updateStatusForm

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

const OrderController = { index, show, updateStatus, financials }

export default OrderController