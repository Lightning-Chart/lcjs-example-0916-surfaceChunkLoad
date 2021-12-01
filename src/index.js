/**
 * Example showcasing how large Surface Charts can be loaded in several small parts instead of 1 large data set
 */

const lcjs = require('@arction/lcjs')
const xydata = require('@arction/xydata')
const {
    lightningChart,
    LUT,
    ColorRGBA,
    PalettedFill,
    emptyLine,
    LegendBoxBuilders,
    ColorShadingStyles,
    Themes
} = lcjs
const { createWaterDropDataGenerator } = xydata

const COLUMNS = 2000
const ROWS = 2000
const CHUNK_SIZE = 1000

// Create chart and series.
const chart = lightningChart().Chart3D({
    disableAnimations: true,
    // theme: Themes.darkGold
})

const surfaceGrid = chart.addSurfaceGridSeries({
    columns: COLUMNS,
    rows: ROWS,
})
    .setColorShadingStyle(new ColorShadingStyles.Phong())
    .setFillStyle(
        new PalettedFill({
            lookUpProperty: 'y',
            lut: new LUT({
                interpolate: false,
                steps: [
                    { value: 0, label: '0', color: ColorRGBA(0, 0, 0) },
                    { value: 15, label: '15', color: ColorRGBA(0, 255, 0) },
                    { value: 30, label: '30', color: ColorRGBA(255, 0, 0) },
                    { value: 40, label: '40', color: ColorRGBA(0, 0, 255) },
                    { value: 50, label: '50', color: ColorRGBA(255, 255, 0) },
                    { value: 75, label: '75', color: ColorRGBA(0, 255, 255) },
                ],
            }),
        }),
    )
    .setWireframeStyle(emptyLine)

const legend = chart.addLegendBox(LegendBoxBuilders.HorizontalLegendBox).add(chart)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.80,
    })

// Load data set one "chunk" at a time. Chunk refers to a smaller sub set of the entire data set.
// Loading large data sets in parts is extremely efficient in terms of memory usage and application usability.
;(async () => {
    const chunks = []
    for (let column = 0; column < COLUMNS; column += CHUNK_SIZE) {
        for (let row = 0; row < ROWS; row += CHUNK_SIZE) {
            chunks.push({column, row})
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

        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    chart.setTitle(`Surface Grid ${COLUMNS}x${ROWS} (total ${((COLUMNS*ROWS)/10**6).toFixed(1)} million data points)`)

})();
