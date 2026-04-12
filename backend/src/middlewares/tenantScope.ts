import { Request, Response, NextFunction, RequestHandler } from 'express'
import * as darywinTypes from ':darywin-types'
import * as env from '../config/env.config'
import * as accessLog from '../observability/tenantAccessLog'

/*
 * tenantScope — default-deny authorization middleware.
 *
 *                       +-----------------------+
 *                       | marker on route?      |
 *                       +-----------------------+
 *                         |       |       |       |
 *                   @Public @AdminOnly @TenantScoped  (none)
 *                         |       |       |       |
 *                     pass  admin?    any user    DW_TENANT_ENFORCE
 *                            |   \      |          /   |   \
 *                          yes  no   attach       off warn strict
 *                            |   |  req.tenantFilter | |    |
 *                          pass 403   (admin={},     pass log+pass 403
 *                                     agency={agency:_id})
 *
 * Invariant: for a non-admin user on a @TenantScoped route, the resolved
 * filter MUST contain a non-empty agency constraint. Empty filter = panic.
 */

export type TenantMarker = 'AdminOnly' | 'TenantScoped' | 'Public'

export const MARKER_KEY = '__tenantMarker__'

type EnforceMode = 'off' | 'warn' | 'strict'

const getEnforceMode = (): EnforceMode => {
  const raw = (env.__env__('DW_TENANT_ENFORCE', false, 'warn') || 'warn').toLowerCase()
  if (raw === 'off' || raw === 'warn' || raw === 'strict') {
    return raw
  }
  return 'warn'
}

const getMarker = (req: Request): TenantMarker | undefined => {
  const route = (req as any).route
  const stack = route?.stack as Array<{ handle: RequestHandler & { [k: string]: any } }> | undefined
  if (!stack) return undefined
  for (const layer of stack) {
    const m = (layer.handle as any)?.[MARKER_KEY]
    if (m) return m as TenantMarker
  }
  return undefined
}

const routeLabel = (req: Request): string => {
  const route = (req as any).route
  return (route?.path as string) || req.path
}

export const tenantScope = (req: Request, res: Response, next: NextFunction): void => {
  const mode = getEnforceMode()
  if (mode === 'off') {
    next()
    return
  }

  const marker = getMarker(req)
  const route = routeLabel(req)

  if (marker === 'Public') {
    accessLog.emit({ route, method: req.method, marker: 'Public', decision: 'allow' })
    next()
    return
  }

  if (!req.user) {
    accessLog.emitCritical({
      route,
      method: req.method,
      marker: marker ?? 'none',
      decision: 'deny',
      reason: 'missing_req_user_on_authenticated_route',
    })
    res.status(500).send({ message: 'Internal authorization error' })
    return
  }

  const userId = req.user._id.toString()
  const userType = req.user.type

  if (marker === 'AdminOnly') {
    if (userType === darywinTypes.UserType.Admin) {
      accessLog.emit({ userId, userType, route, method: req.method, marker, decision: 'allow' })
      next()
      return
    }
    accessLog.recordDenial(userType, route, 'admin_only')
    accessLog.emit({ userId, userType, route, method: req.method, marker, decision: 'deny', reason: 'admin_only' })
    res.status(403).send({ message: 'Forbidden' })
    return
  }

  if (marker === 'TenantScoped') {
    if (userType === darywinTypes.UserType.Admin) {
      req.tenantFilter = {}
      accessLog.emit({ userId, userType, route, method: req.method, marker, decision: 'scope-injected', scope: {} })
      next()
      return
    }
    if (userType === darywinTypes.UserType.User) {
      // Customer (frontend) traffic — agency isolation N/A. Controller scopes by req.user._id.
      req.tenantFilter = {}
      accessLog.emit({ userId, userType, route, method: req.method, marker, decision: 'scope-injected', scope: {} })
      next()
      return
    }
    req.tenantFilter = { agency: req.user._id }
    const filter = req.tenantFilter
    if (!filter || Object.keys(filter).length === 0) {
      accessLog.recordEmptyFilterBlocked()
      accessLog.emitCritical({
        userId,
        userType,
        route,
        method: req.method,
        marker,
        decision: 'deny',
        reason: 'empty_scope_for_non_admin',
      })
      res.status(500).send({ message: 'Internal authorization error' })
      return
    }
    accessLog.emit({ userId, userType, route, method: req.method, marker, decision: 'scope-injected', scope: filter })
    next()
    return
  }

  // no marker — default-deny
  if (mode === 'warn') {
    accessLog.emit({
      userId,
      userType,
      route,
      method: req.method,
      marker: 'none',
      decision: 'warn',
      reason: 'default_deny_warn_mode',
    })
    next()
    return
  }

  accessLog.recordDenial(userType, route, 'default_deny_no_marker')
  accessLog.emit({
    userId,
    userType,
    route,
    method: req.method,
    marker: 'none',
    decision: 'deny',
    reason: 'default_deny_no_marker',
  })
  res.status(403).send({ message: 'Forbidden' })
}

export const markHandler = <T extends RequestHandler>(handler: T, marker: TenantMarker): T => {
  ;(handler as any)[MARKER_KEY] = marker
  return handler
}

export default tenantScope
