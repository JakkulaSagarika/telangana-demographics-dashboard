# Telangana district boundaries

Export the Telangana districts shapefile as GeoJSON and save it here as:

`telangana-districts.geojson`

The map reads a district name from one of these GeoJSON properties: `district`, `DISTRICT`, or `NAME_2`. Ensure its spelling matches the `name` column in the Excel workbook. A convenient conversion command is:

```bash
ogr2ogr -f GeoJSON telangana-districts.geojson /path/to/telangana_districts.shp
```
