import { readFile, writeFile } from 'node:fs/promises'
globalThis.self = globalThis
const { default: shp } = await import('../frontend/node_modules/shpjs/dist/shp.esm.js')

const [source, destination] = process.argv.slice(2)
if (!source || !destination) throw new Error('Usage: node convert-district-shapefile.mjs <source.zip> <destination.geojson>')

const file = await readFile(source)
const result = await shp(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength))
const collection = Array.isArray(result) ? result[0] : result
await writeFile(destination, JSON.stringify(collection))
console.log(`Wrote ${collection.features.length} district features to ${destination}`)
