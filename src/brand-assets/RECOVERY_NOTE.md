# Brand SSOT recovery — 25 July 2026

The previous two committed Base64 parts contained 13,500 decoded bytes, while the first declared archive record alone required 38,138 bytes. The source archive was therefore physically incomplete and could not be repaired by changing decoder mode.

This branch rebuilds the raster derivatives from the accepted coded vector silhouette already present in `public/brand-emblem.svg`, records all source and output integrity data in `manifest.json`, and upgrades materialization to fail before writing when any part, full archive, entry size, or entry SHA-256 differs.

The temporary recovery workflow is diagnostic/write-only and must be deleted before merge.
