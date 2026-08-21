# Penglai Plugin Registry

Public, signed plugin catalog for [Penglai](https://github.com/kevinchennewbee/PenglaiAgent).

Penglai clients discover plugins only from **immutable GitHub Releases** of this repository. A mutable branch, a `latest` asset, or an unsigned JSON file is not a trust source.

## Trust rules

- Catalog schema: `penglai.plugin-catalog.v1`
- Release tags: `plugin-catalog-v1.NNNNNN` (monotonic six-digit sequence)
- Required assets: `plugin-catalog-v1.json`, `plugin-catalog-v1.json.sig`, plugin tarballs, matching `.tgz.sig` files, and `SHA256SUMS`
- Each artifact names an exact `target` (`darwin-arm64`, `darwin-x64`, `win32-x64`) or `any` for portable packages
- Clients select exact host target, then `any`; they never use `artifacts[0]`
- Remote plugins ship `defaultEnabled: false` and `nativeCode: false`
- Signature verification, SHA mismatch, mutable Release, wrong target, or unsafe redirect fail closed

Signing keys stay **outside** this repository. Never commit PEM files, API tokens, logs, or user data.

## Pilot plugin

`@penglai/plugin-pilot` is a reviewed, unprivileged echo tool used to prove refresh, download, verify, disabled-by-default install, owner confirmation, enable, restart restore, update, rollback, revoke, and offline last-good cache.
