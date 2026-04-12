import express from 'express'
import routeNames from '../config/bookingRoutes.config'
import * as bookingController from '../controllers/bookingController'
import { tenantScoped, publicRoute } from './_markers'

const routes = express.Router()

routes.route(routeNames.create).post(...tenantScoped(bookingController.create))
routes.route(routeNames.checkout).post(...publicRoute(bookingController.checkout))
routes.route(routeNames.update).put(...tenantScoped(bookingController.update))
routes.route(routeNames.updateStatus).post(...tenantScoped(bookingController.updateStatus))
routes.route(routeNames.delete).post(...tenantScoped(bookingController.deleteBookings))
routes.route(routeNames.deleteTempBooking).delete(...publicRoute(bookingController.deleteTempBooking))
routes.route(routeNames.getBooking).get(...tenantScoped(bookingController.getBooking))
routes.route(routeNames.getBookingId).get(...publicRoute(bookingController.getBookingId))
routes.route(routeNames.getBookings).post(...tenantScoped(bookingController.getBookings))
routes.route(routeNames.hasBookings).get(...tenantScoped(bookingController.hasBookings))
routes.route(routeNames.cancelBooking).post(...tenantScoped(bookingController.cancelBooking))

export default routes
