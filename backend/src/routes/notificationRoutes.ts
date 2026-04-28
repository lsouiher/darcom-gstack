import express from 'express'
import routeNames from '../config/notificationRoutes.config'
import * as notificationController from '../controllers/notificationController'
import { tenantScoped } from './_markers'

const routes = express.Router()

routes.route(routeNames.notificationCounter).get(...tenantScoped(notificationController.notificationCounter))
routes.route(routeNames.getNotifications).get(...tenantScoped(notificationController.getNotifications))
routes.route(routeNames.markAsRead).post(...tenantScoped(notificationController.markAsRead))
routes.route(routeNames.markAsUnRead).post(...tenantScoped(notificationController.markAsUnRead))
routes.route(routeNames.delete).post(...tenantScoped(notificationController.deleteNotifications))

export default routes
