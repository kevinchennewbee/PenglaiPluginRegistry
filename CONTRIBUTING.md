# Contributing

This repository publishes signed plugin catalogs. Penglai clients do not load plugins from git branches.

## Required for every catalog release

1. Tag `plugin-catalog-v1.NNNNNN` with a higher sequence than the previous catalog.
2. Enable Immutable Releases before publishing.
3. Upload frozen assets only: signed catalog JSON, catalog signature, plugin tarballs, tarball signatures, SHA256SUMS.
4. Each artifact must name `target`. Portable packages use `target: "any"`.
5. `defaultEnabled` must be `false`. `nativeCode` must be `false`.
6. Never commit private keys, PEM files, API tokens, logs, user data, or local evidence dumps.

Signing is done offline with the plugin-catalog Ed25519 key that matches the public key embedded in Penglai. If that private key is lost, already-shipped clients cannot trust a replacement key without a new Penglai release.
