# plugin-catalog-v1

Penglai clients parse this schema in `packages/plugin-registry`.

```text
schema: penglai.plugin-catalog.v1
catalogId: stable
sequence: <positive integer>
issuedAt / expiresAt: ISO-8601
centerProtocol: 1
signingKeyId: embedded plugin catalog key id
entries[]:
  id, version, bilingual title/summary
  publisher, provenanceClass, license
  dsh.exact: 0.1.1-rc.1
  minPenglai: 0.5.1
  capabilities[], permissions[]
  defaultEnabled: false
  nativeCode: false
  entry: relative JS file
  targets: darwin-arm64 | darwin-x64 | win32-x64 | any
  artifacts[]:
    target, releaseTag, assetId, https GitHub download URL, size, sha256, signatureAsset
revocations[]: id, version, sha256, severity, reason, advisory
```

Artifact selection: exact host target, then `any`, otherwise fail closed.
