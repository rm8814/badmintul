# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Superadmin bootstrap

Create the user through the normal `/signup` flow first, then promote that existing account with deploy-level Convex access. This operation is an `internalMutation`; it is not reachable from the browser client and there is no public “become superadmin” path.

From `app/`, use the development deployment:

```powershell
npx convex run --dev admin:promoteUserToSuperadmin '{"email":"admin@example.com"}'
```

Use the production deployment only when the account exists there:

```powershell
npx convex run --prod admin:promoteUserToSuperadmin '{"email":"admin@example.com"}'
```

The email lookup is case-insensitive. The command fails if no matching user exists. Treat deploy access as sensitive because this operation changes a user’s role.
