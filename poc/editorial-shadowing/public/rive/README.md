# Rive interaction assets

The editorial POC reserves `/rive/english-twin-guide.riv` for a first-party or properly licensed interactive guide.

No generated stock/commercial AI image is used by this POC. `components/RiveSlot.tsx` exposes the intended local asset path through `data-rive-src` without making the page depend on a remote asset.

When the final `.riv` is approved, add the official Rive web runtime and replace the placeholder body of `RiveSlot` with the real player while preserving the component API.
