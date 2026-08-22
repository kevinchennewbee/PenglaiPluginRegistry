# Penglai Office Reader

Read-only text extraction for `.docx`, `.xlsx`, and `.pptx` files through the official DSH filesystem service.

The plugin registers one model-facing tool, `penglai_office_extract`. It resolves the user-supplied path through `ctx.fs`, performs a bounded raw-byte read, checks the ZIP central directory before decompression, and returns capped plain text under the mandatory DSH rc.1 structured-output contract. Extracted text is explicitly rendered as untrusted document content. The plugin does not execute macros, write Office files, access the network, or bypass DSH with Node's raw filesystem API.

This first version is deliberately a reader, not a full office suite. Formulas are reported but not calculated; layout, charts, images, comments, and tracked-change semantics are not reproduced. Password-protected or malformed files fail closed.
