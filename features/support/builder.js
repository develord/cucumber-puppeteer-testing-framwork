import puppeteer from 'puppeteer'

/**
  * @desc this class builder pattern will contain the puppetter builder browser and page
  * and all functions helpers related to the page or browser
  * examples waitAndClick , waitAndFind for element by ..., Close browser, Open page.
  * @author amine.fredj@neoxam.com
  * @required puppeteer
*/

export default class Builder {
  static async build (viewport) {
    const launchOptions = {
      headless: true,
      SlowMo: 0,
      args: [
        '--no-sandbox',
        '--disable-setui-sandbox',
        '--disable-web-security'
      ]
    }
    const browser = await puppeteer.launch(launchOptions)
    const page = await browser.newPage()
    const extendedPage = new Builder(page)
    await page.setDefaultTimeout(10000)
    switch (viewport) {
      case 'Mobile':
        const mobileViewport = puppeteer.devices['iPhone X']
        await page.emulate(mobileViewport)
        break
      case 'Tablet':
        const tabletViewport = puppeteer.devices['iPad landscape']
        await page.emulate(tabletViewport)
        break
      case 'Desktop':
        await page.setViewport({ width: 1440, height: 800, deviceScaleFactor: process.platform === 'darwin' ? 2 : 1 })
        break
    }

    return new Proxy(extendedPage, {
      get: function (_target, property) {
        return extendedPage[property] || browser[property] || page[property]
      }
    })
  }

  constructor (page) {
    this.page = page
  }
}
