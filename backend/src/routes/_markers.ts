import { RequestHandler } from 'express'
import authJwt from '../middlewares/authJwt'
import { tenantScope, markHandler, TenantMarker } from '../middlewares/tenantScope'

/*
 * Route marker helpers.
 *
 * Wrap a handler (or handler chain) with a marker + the authJwt + tenantScope
 * middleware chain so authorization is enforced as a structural invariant.
 *
 * Usage:
 *   routes.route(path).post(...adminOnly(controller.fn))
 *   routes.route(path).get(...tenantScoped(controller.fn))
 *   routes.route(path).post(...publicRoute(controller.fn))
 *
 * Returned array is spread into router method args.
 */

const wrap = (marker: TenantMarker, handlers: RequestHandler[]): RequestHandler[] => {
  if (handlers.length === 0) throw new Error('marker helper requires at least one handler')
  const last = handlers[handlers.length - 1]
  const rest = handlers.slice(0, -1)
  const marked = markHandler(last, marker)
  if (marker === 'Public') {
    return [...rest, marked]
  }
  return [authJwt.verifyToken, tenantScope, ...rest, marked]
}

export const adminOnly = (...handlers: RequestHandler[]): RequestHandler[] => wrap('AdminOnly', handlers)
export const tenantScoped = (...handlers: RequestHandler[]): RequestHandler[] => wrap('TenantScoped', handlers)
export const publicRoute = (...handlers: RequestHandler[]): RequestHandler[] => wrap('Public', handlers)
