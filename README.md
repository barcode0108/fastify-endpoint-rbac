# @climba03003/fastify-endpoint-rbac

This plugin used to manage the endpoint role-base access control. It will collect
all the specified roles and you can specify how to check the access control globally
or per-route.

## Install
```
npm install @climba03003/fastify-endpoint-rbac --save

yarn add @climba03003/fastify-endpoint-rbac
```

## Usage

```ts
import FastifyRBAC from '@climba03003/fastify-endpoint-rbac'

fastify.register(FastifyRBAC, {
  // how to retrieve account roles
  retrieveAccountRoles(request, reply) {
    return [] // must return array or Promise<array>
  },
  // how to check rbac globally
  checkRBAC(routeRoles, accountRoles) {
    return true // must return boolean or Promise<boolean>
  },
  // change the error message when return 403
  forbiddenMessage: 'No Privilege'
})

fastify.get(
  '/',
  {
    config: {
      rbac: {
        // specify roles for this route
        roles: ['index:read'], 
        // route base rbac check
        checkRBAC(routeRoles, accountRoles) {
          return true // must return boolean or promise boolean
        },
      }
    }
  }
)

```

### Decorators

```ts
// Map of route and roles
fastify.rbac.routeRBAC
// Map {
//  GET:/ => ['index:read']
// }

// Array of all roles
fastify.rbac.roles
// ['index:read']

```
