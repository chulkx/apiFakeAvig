# Changelog

## Unreleased

### Changed

- El constructor de payloads ahora preserva todos los campos adicionales del evento Avigilon en lugar de reenviar solo un subconjunto fijo.
- La simulacion por escenarios ahora conserva propiedades arbitrarias de cada evento, incluyendo arreglos y objetos anidados.
- La documentacion fue actualizada para reflejar el soporte de payloads completos y el archivo de escenarios por defecto `scenarios_embotellamiento_1_Via.json`.

### Compatibility

- Se mantienen como obligatorios `analyticEventName` y `cameraId`.
- Si faltan `id` o `timestamp`, el sistema los genera antes de firmar y enviar el webhook.
