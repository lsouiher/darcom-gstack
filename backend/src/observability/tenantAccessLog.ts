import * as logger from '../utils/logger'

export type TenantDecision = 'allow' | 'deny' | 'warn' | 'scope-injected'

export interface TenantAccessEvent {
  userId?: string
  userType?: string
  route: string
  method: string
  marker: string
  decision: TenantDecision
  scope?: Record<string, unknown>
  reason?: string
}

const counters = {
  tenant_access_denied_total: new Map<string, number>(),
  tenant_filter_empty_blocked_total: 0,
}

const key = (role: string, route: string, reason: string) => `${role}|${route}|${reason}`

export const recordDenial = (role: string, route: string, reason: string): void => {
  const k = key(role, route, reason)
  counters.tenant_access_denied_total.set(k, (counters.tenant_access_denied_total.get(k) ?? 0) + 1)
}

export const recordEmptyFilterBlocked = (): void => {
  counters.tenant_filter_empty_blocked_total += 1
}

export const getCounters = () => ({
  tenant_access_denied_total: Object.fromEntries(counters.tenant_access_denied_total),
  tenant_filter_empty_blocked_total: counters.tenant_filter_empty_blocked_total,
})

export const resetCounters = (): void => {
  counters.tenant_access_denied_total.clear()
  counters.tenant_filter_empty_blocked_total = 0
}

export const emit = (event: TenantAccessEvent): void => {
  const payload = JSON.stringify({ kind: 'tenant_access', ...event })
  if (event.decision === 'deny') {
    logger.warn(payload)
  } else {
    logger.info(payload)
  }
}

export const emitCritical = (event: TenantAccessEvent): void => {
  logger.error(JSON.stringify({ kind: 'tenant_access_critical', ...event }))
}
