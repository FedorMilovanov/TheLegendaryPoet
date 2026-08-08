# Hall v3 — exhibit rights and provenance register

Hall v3 may make documentary material feel more authoritative than an ordinary web card. Therefore every historical exhibit asset needs explicit provenance and publication status before runtime use.

## Required record

Each documentary asset eventually receives a machine-readable or validator-consumable record containing at least:

```text
assetId
poetId
kind
sourceTitle
sourceInstitution
sourceUrlOrArchiveAddress
objectIdOrCallNumber
sourceDate
rightsStatus
rightsBasis
creditLine
sourceFileHash
runtimeAssetPath
verificationStatus
notes
```

## Status model

Suggested statuses:

- `candidate` — identified, not yet verified;
- `source-verified` — object/source identity verified;
- `rights-pending` — identity known, publication permission/basis unresolved;
- `approved` — identity and publication basis accepted for the intended Hall use;
- `blocked` — must not ship;
- `retired` — formerly considered, no longer used.

Only `approved` documentary assets may enter the production Hall manifest.

## Evidence rules

- File availability is not permission.
- Presence in Git history/Drive/archive storage is not publication authority.
- Museum/institution descriptive text does not automatically establish a reusable image licence.
- A catalogue entry is not the same as the object image/facsimile.
- OCR is not a substitute for the visual source when the exhibit claims to show the original object.
- AI reconstruction is never recorded as a documentary facsimile.

## Generated/editorial imagery

Editorial generated imagery may be used only when clearly functioning as editorial illustration rather than historical evidence. It must not mimic an archive object in a way that would mislead the viewer about authenticity.

## Portraits

Portrait selection records:

- sitter identity;
- approximate/known date;
- photographer/artist where known;
- source institution/publication;
- rights status;
- crop/derivative provenance.

A visually attractive but unidentified portrait is not accepted as a museum-grade hero asset.

## Manuscripts and signatures

No typed approximation of a poet's signature or handwritten-looking generated text may be presented as an autograph. Use a verified scan/reproduction or omit the element.

## Product separation

The rights register owns exhibit-media permission/provenance only. Canonical poet biography/text remains owned by the Product data model and editorial source policy.

## Foundation boundary

This file defines the schema/policy only. It does not declare any current Hall asset rights-approved. The first real records are created with the Pushkin/reference acquisition work and validated before the vertical slice ships.
