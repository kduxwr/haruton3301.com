import { JSDOM } from 'jsdom'
import path from 'path'
import fs from 'fs'
import axios from 'axios'

const srcList = []
let imagesDirPath

module.exports = async function () {
  const {
    rootDir,
    generate: { dir: generateDir },
  } = this.options

  this.nuxt.hook('generate:page', async (arg) => {
    const pattern = /^.articles.+$/g

    if (arg.route.match(pattern) != null) {
      const dom = new JSDOM(arg.html)
      const images = dom.window.document.querySelectorAll('article p img')
      console.log('images')

      images.forEach((image) => {
        const srcUrl = `https:${image.getAttribute('data-src')}`
        const fileName = srcUrl.match('.+/(.+?)([?#;].*)?$')[1]
        srcList.push({
          srcUrl,
          fileName,
        })
      })
    }
    console.log(srcList)
  })

  this.nuxt.hook('generate:done', async () => {
    imagesDirPath = path.resolve(rootDir, generateDir, 'images')
    if (!fs.existsSync(imagesDirPath)) {
      fs.mkdirSync(imagesDirPath)
    }

    const promiseList = []
    srcList.forEach((src) => {
      const srcUrl = src.srcUrl
      const fileName = src.fileName
      const generate_file_path = path.resolve(
        rootDir,
        generateDir,
        'images',
        fileName
      )

      promiseList.push(downloadPromise(srcUrl, generate_file_path))
    })

    const result = await Promise.all(promiseList)
    console.log(result)

    console.log(srcList)
  })

  const downloadPromise = (srcUrl, filePath) => {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(imagesDirPath)) {
        resolve(false)
      }

      axios.get(srcUrl, { responseType: 'arraybuffer' }).then(async (res) => {
        fs.writeFileSync(filePath, new Buffer.from(res.data))
        if (fs.existsSync(imagesDirPath)) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }
}
