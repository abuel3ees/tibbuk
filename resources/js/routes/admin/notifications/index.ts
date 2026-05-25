import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/notifications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::index
* @see app/Http/Controllers/Admin/NotificationController.php:11
* @route '/admin/notifications'
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
* @see \App\Http\Controllers\Admin\NotificationController::read
* @see app/Http/Controllers/Admin/NotificationController.php:22
* @route '/admin/notifications/read'
*/
export const read = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: read.url(options),
    method: 'post',
})

read.definition = {
    methods: ["post"],
    url: '/admin/notifications/read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\NotificationController::read
* @see app/Http/Controllers/Admin/NotificationController.php:22
* @route '/admin/notifications/read'
*/
read.url = (options?: RouteQueryOptions) => {
    return read.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NotificationController::read
* @see app/Http/Controllers/Admin/NotificationController.php:22
* @route '/admin/notifications/read'
*/
read.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: read.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::read
* @see app/Http/Controllers/Admin/NotificationController.php:22
* @route '/admin/notifications/read'
*/
const readForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: read.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::read
* @see app/Http/Controllers/Admin/NotificationController.php:22
* @route '/admin/notifications/read'
*/
readForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: read.url(options),
    method: 'post',
})

read.form = readForm

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
export const unreadCount = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unreadCount.url(options),
    method: 'get',
})

unreadCount.definition = {
    methods: ["get","head"],
    url: '/admin/notifications/unread-count',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
unreadCount.url = (options?: RouteQueryOptions) => {
    return unreadCount.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
unreadCount.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unreadCount.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
unreadCount.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: unreadCount.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
const unreadCountForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: unreadCount.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
unreadCountForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: unreadCount.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\NotificationController::unreadCount
* @see app/Http/Controllers/Admin/NotificationController.php:29
* @route '/admin/notifications/unread-count'
*/
unreadCountForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: unreadCount.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

unreadCount.form = unreadCountForm

const notifications = {
    index: Object.assign(index, index),
    read: Object.assign(read, read),
    unreadCount: Object.assign(unreadCount, unreadCount),
}

export default notifications