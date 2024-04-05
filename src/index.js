/**
 * Example showcasing how large Surface Charts can be loaded in several small parts instead of 1 large data set
 */

// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Import xydata
const xydata = require('@arction/xydata')

const { lightningChart, LUT, PalettedFill, emptyLine, LegendBoxBuilders, ColorShadingStyles, regularColorSteps, Themes } = lcjs
const { createWaterDropDataGenerator } = xydata

const COLUMNS = 2000
const ROWS = 2000
const CHUNK_SIZE = 1000

// Create chart and series.
const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        }).Chart3D({
    theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
})

const theme = chart.getTheme()
const surfaceGrid = chart
    .addSurfaceGridSeries({
        columns: COLUMNS,
        rows: ROWS,
    })
    .setColorShadingStyle(new ColorShadingStyles.Phong())
    .setFillStyle(
        new PalettedFill({
            lookUpProperty: 'y',
            lut: new LUT({
                interpolate: false,
                steps: regularColorSteps(0, 75, theme.examples.coldHotColorPalette),
            }),
        }),
    )
    .setWireframeStyle(emptyLine)

const legend = chart
    .addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
    .add(chart)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.8,
    })

// Load data set one "chunk" at a time. Chunk refers to a smaller sub set of the entire data set.
// Loading large data sets in parts is extremely efficient in terms of memory usage and application usability.
;(async () => {
    const chunks = []
    for (let column = 0; column < COLUMNS; column += CHUNK_SIZE) {
        for (let row = 0; row < ROWS; row += CHUNK_SIZE) {
            chunks.push({ column, row })
        }
    }

    chart.setTitle(`Loading data in chunks ... (0 / ${chunks.length})`)
    for (let iChunk = 0; iChunk < chunks.length; iChunk += 1) {
        const chunk = chunks[iChunk]

        const rand = (min, max) => min + Math.random() * (max - min)
        const waterDropsCount = Math.round(rand(1, 5))
        const waterdropOptions = new Array(waterDropsCount).fill(0).map((_) => ({
            rowNormalized: rand(0.0, 1.0),
            columnNormalized: rand(0.0, 1.0),
            amplitude: rand(5, 60),
        }))
        const chunkData = await createWaterDropDataGenerator()
            .setColumns(CHUNK_SIZE)
            .setRows(CHUNK_SIZE)
            .setWaterDrops(waterdropOptions)
            .generate()

        surfaceGrid.invalidateHeightMap({
            iColumn: chunk.column,
            iRow: chunk.row,
            values: chunkData,
        })

        chart.setTitle(`Loading data in chunks ... (${iChunk + 1} / ${chunks.length})`)

        await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    chart.setTitle(`Surface Grid ${COLUMNS}x${ROWS} (total ${((COLUMNS * ROWS) / 10 ** 6).toFixed(1)} million data points)`)
})()
