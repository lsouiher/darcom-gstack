import express from 'express'
import multer from 'multer'
import routeNames from '../config/userRoutes.config'
import * as userController from '../controllers/userController'
import { tenantScoped, publicRoute, adminOnly } from './_markers'

const routes = express.Router()

routes.route(routeNames.signup).post(...publicRoute(userController.signup))
// Admin account creation is gated behind an existing admin session. Provision the
// first admin via the seed script (`backend/src/setup/seed-prod.ts`), not this route.
routes.route(routeNames.adminSignup).post(...adminOnly(userController.adminSignup))
routes.route(routeNames.create).post(...tenantScoped(userController.create))
routes.route(routeNames.checkToken).get(...publicRoute(userController.checkToken))
routes.route(routeNames.deleteTokens).delete(...publicRoute(userController.deleteTokens))
routes.route(routeNames.resend).post(...publicRoute(userController.resend))
routes.route(routeNames.activate).post(...publicRoute(userController.activate))
routes.route(routeNames.signin).post(...publicRoute(userController.signin))
routes.route(routeNames.socialSignin).post(...publicRoute(userController.socialSignin))
routes.route(routeNames.signout).post(...publicRoute(userController.signout))
routes.route(routeNames.getPushToken).get(...tenantScoped(userController.getPushToken))
routes.route(routeNames.createPushToken).post(...tenantScoped(userController.createPushToken))
routes.route(routeNames.deletePushToken).post(...tenantScoped(userController.deletePushToken))
routes.route(routeNames.validateEmail).post(...publicRoute(userController.validateEmail))
routes.route(routeNames.validateAccessToken).post(...tenantScoped(userController.validateAccessToken))
routes.route(routeNames.confirmEmail).get(...publicRoute(userController.confirmEmail))
routes.route(routeNames.confirmEmail).post(...publicRoute(userController.confirmEmail))
routes.route(routeNames.resendLink).post(...tenantScoped(userController.resendLink))
routes.route(routeNames.update).post(...tenantScoped(userController.update))
routes.route(routeNames.updateEmailNotifications).post(...tenantScoped(userController.updateEmailNotifications))
routes.route(routeNames.updateLanguage).post(...tenantScoped(userController.updateLanguage))
routes.route(routeNames.getUser).get(...tenantScoped(userController.getUser))
routes.route(routeNames.createAvatar).post(...tenantScoped(multer({ storage: multer.memoryStorage() }).single('image'), userController.createAvatar))
routes.route(routeNames.updateAvatar).post(...tenantScoped(multer({ storage: multer.memoryStorage() }).single('image'), userController.updateAvatar))
routes.route(routeNames.deleteAvatar).post(...tenantScoped(userController.deleteAvatar))
routes.route(routeNames.deleteTempAvatar).post(...tenantScoped(userController.deleteTempAvatar))
routes.route(routeNames.changePassword).post(...tenantScoped(userController.changePassword))
routes.route(routeNames.checkPassword).get(...tenantScoped(userController.checkPassword))
routes.route(routeNames.getUsers).post(...tenantScoped(userController.getUsers))
routes.route(routeNames.delete).post(...tenantScoped(userController.deleteUsers))
routes.route(routeNames.verifyRecaptcha).post(...publicRoute(userController.verifyRecaptcha))
routes.route(routeNames.sendEmail).post(...publicRoute(userController.sendEmail))
routes.route(routeNames.hasPassword).get(...tenantScoped(userController.hasPassword))

export default routes
