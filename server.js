const express = require('express')
const cors = require('cors')
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
const cssnano = require('cssnano')
require('dotenv').config()
const crypto = require('crypto')
const { LRUCache } = require('lru-cache')

const app = express()

app.use(cors())
// app.use(cors({
//   origin: 'http://localhost:3000'
// }));

const PORT = Number(process.env.PORT) || 3336
const CACHE_SIZE = Number(process.env.CACHE_SIZE) || 500

const cacheOptions = { max: CACHE_SIZE }
const cache = new LRUCache(cacheOptions)

app.use(express.json())

app.get('/', function (req, res) {
  res.send('Hello friend')
})

app.post('/generate', async (req, res) => {
  const { html, includeBase, extraClasses } = req.body

  // Validate input
  if (typeof html !== 'string' || html.trim() === '') {
    return res.status(422).send({ errors: ['html_is_required'] })
  }

  if (extraClasses && !Array.isArray(extraClasses)) {
    return res.status(422).send({ errors: ['extra_classes_must_be_an_array'] })
  }

  // Generate cache key using a hash

  const cacheKey = crypto
    .createHash('sha256')
    .update(JSON.stringify({ html, includeBase, extraClasses }))
    .digest('hex')

  // Check if the result is in the cache
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return res.send(cachedResult)
  }

  // Generate styles to process
  let stylesToProcess = ' @tailwind components; @tailwind utilities; '
  if (includeBase) {
    stylesToProcess = ' @tailwind base; ' + stylesToProcess
  }

  if (extraClasses && extraClasses.length > 0) {
    // Build valid styles from extraClasses
    for (const extraClass of extraClasses) {
      const { name, classesArray } = extraClass

      if (typeof name !== 'string' || !Array.isArray(classesArray)) {
        console.warn(`Skipping invalid extraClass: ${JSON.stringify(extraClass)}`)
        continue
      }

      const validClasses = []

      for (const cls of classesArray) {
        try {
          // Validate the class by processing it with PostCSS
          await postcss([
            tailwindcss({
              content: [{ raw: html, extension: 'html' }],
            }),
          ]).process(
            `
            .test-class {
              @apply ${cls};
            }
          `,
            { from: undefined }
          )
          validClasses.push(cls) // Add valid class
        } catch (err) {
          console.warn(`Invalid class '${cls}' skipped.`)
        }
      }

      if (validClasses.length > 0) {
        stylesToProcess += `
          ${name} {
            @apply ${validClasses.join(' ')};
          }
        `
      }
    }
  }

  try {
    const result = await postcss([
      tailwindcss({
        content: [{ raw: html, extension: 'html' }],
      }),
      cssnano(),
    ]).process(stylesToProcess, { from: undefined })

    const css = result.css
    cache.set(cacheKey, css)
    res.send(css)
  } catch (error) {
    console.error('Error processing Tailwind CSS:', error)

    res.status(422).send({
      errors: [error.reason || error.message || 'Unknown error occurred'],
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
