const express = require('express')
const cors = require('cors')
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
require('dotenv').config()

const app = express()

app.use(cors())
// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

const PORT = Number(process.env.PORT) || 3336
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 500

const { LRUCache } = require('lru-cache')

const cacheOptions = { max: CACHE_SIZE }
const cache = new LRUCache(cacheOptions)

app.use(express.json())

app.get('/', function (req, res) {
  res.send('Hello friend')
})

app.post('/generate', async (req, res) => {
  const { html, includeBase, extraClasses } = req.body

  if (!html) {
    return res.status(400).send('html_is_required')
  }

  // Check if the result is in the cache
  const cacheKey = includeBase
    ? `base_${html}_${extraClasses || ''}`
    : `${html}_${extraClasses || ''}`
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return res.send(cachedResult)
  }

  let stylesToProcess = '@import "tailwindcss/components"; @import "tailwindcss/utilities";'
  if (includeBase) {
    stylesToProcess = '@import "tailwindcss/base";' + stylesToProcess
  }

  // Add the extra styles (styles with @apply) if provided
  if (extraClasses) {
    stylesToProcess += extraClasses
  }

  try {
    const result = await postcss([
      tailwindcss({
        mode: 'jit',
        content: [{ raw: html, extension: 'html' }],
      }),
    ]).process(stylesToProcess, {
      from: undefined,
    })

    const css = result.css
    cache.set(cacheKey, css)
    res.send(css)
  } catch (error) {
    console.error(error)
    res.status(500).send('Failed to process CSS')
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
