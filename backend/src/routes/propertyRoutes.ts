import express from 'express'
import multer from 'multer'
import routeNames from '../config/propertyRoutes.config'
import * as propertyController from '../controllers/propertyController'
import { tenantScoped, publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.create).post(...tenantScoped(propertyController.create))
routes.route(routeNames.update).put(...tenantScoped(propertyController.update))
routes.route(routeNames.checkProperty).get(...tenantScoped(propertyController.checkProperty))
routes.route(routeNames.delete).delete(...tenantScoped(propertyController.deleteProperty))
routes.route(routeNames.uploadImage).post(...tenantScoped(multer({ storage: multer.memoryStorage() }).single('image'), propertyController.uploadImage))
routes.route(routeNames.deleteImage).post(...tenantScoped(propertyController.deleteImage))
routes.route(routeNames.deleteTempImage).post(...tenantScoped(propertyController.deleteTempImage))
routes.route(routeNames.getProperty).get(...publicRoute(propertyController.getProperty))
routes.route(routeNames.getProperties).post(...tenantScoped(propertyController.getProperties))
routes.route(routeNames.getBookingProperties).post(...tenantScoped(propertyController.getBookingProperties))
routes.route(routeNames.getFrontendProperties).post(...publicRoute(propertyController.getFrontendProperties))

export default routes
