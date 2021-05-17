import { CheckRBAC, RetrieveAccountRoles } from '../lib'

export const retrieveAccountRoles: RetrieveAccountRoles = function () {
  return ['index:read', 'dynamic:all']
}

export const checkRBAC: CheckRBAC = function (routeRoles, accountRoles) {
  for (let i = accountRoles.length - 1; i >= 0; i--) {
    if (routeRoles.includes(accountRoles[i])) return true
  }
  return false
}
