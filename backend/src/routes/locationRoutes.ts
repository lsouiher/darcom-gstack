import express from 'express'
import multer from 'multer'
import routeNames from '../config/locationRoutes.config'
import * as locationController from '../controllers/locationController'
import { adminOnly, publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.validate).post(...adminOnly(locationController.validate))
routes.route(routeNames.create).post(...adminOnly(locationController.create))
routes.route(routeNames.update).put(...adminOnly(locationController.update))
routes.route(routeNames.delete).delete(...adminOnly(locationController.deleteLocation))
routes.route(routeNames.getLocation).get(...publicRoute(locationController.getLocation))
routes.route(routeNames.getLocations).get(...publicRoute(locationController.getLocations))
routes.route(routeNames.getLocationsWithPosition).get(...publicRoute(locationController.getLocationsWithPosition))
routes.route(routeNames.checkLocation).get(...adminOnly(locationController.checkLocation))
routes.route(routeNames.getLocationId).get(...publicRoute(locationController.getLocationId))
routes.route(routeNames.createImage).post(...adminOnly(multer({ storage: multer.memoryStorage() }).single('image'), locationController.createImage))
routes.route(routeNames.updateImage).post(...adminOnly(multer({ storage: multer.memoryStorage() }).single('image'), locationController.updateImage))
routes.route(routeNames.deleteImage).post(...adminOnly(locationController.deleteImage))
routes.route(routeNames.deleteTempImage).post(...adminOnly(locationController.deleteTempImage))

export default routes
