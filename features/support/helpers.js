'use strict'

const errorWait = 15 // in sec
const warningWait = 4 // in sec
const waitForAction = 170 // in ms
const Helper = require('codeceptjs').helper

module.exports = class MyHelpers extends Helper {
  async _before () {
    this.networkStatus = '[StatusCode]: 200-OK'
    await this.helpers.Puppeteer.page.on('response', response => {
      let req = response.request()
      switch (req._response._status) {
        case 400:
          this.networkStatus = '[StatusCode]: 400-Bad Request'
          break
        case 404:
          this.networkStatus = '[StatusCode]: 404-not found'
          break
        case 500:
          this.networkStatus = '[StatusCode]: 500-server error'
          break
        case 401:
          this.networkStatus = '[StatusCode]: 401-unathorised'
          break
      }
    })
  }

  throwError (description) {
    throw new Error(description + ' ' + this.networkStatus)
  }

  scenario (scenarioName) {
    this.scenarioName = scenarioName
  }

  async setOfflineMode (state) {
    await this.helpers.Puppeteer.page.setOfflineMode(state)
  }

  async refreshPage () {
    await this.helpers.Puppeteer.page.reload()
  }

  async wait (timeMs) {
    await new Promise(resolve => {
      setTimeout(() => resolve(), timeMs)
    })
  }

  async fillField (selector, text) {
    await this.click(selector)
    await this.helpers.Puppeteer.page.keyboard.down('Control')
    await this.helpers.Puppeteer.page.keyboard.press('a')
    await this.helpers.Puppeteer.page.keyboard.press('Backspace')
    await this.helpers.Puppeteer.page.keyboard.up('Control')
    await this.helpers.Puppeteer.page.keyboard.type(text)
  }

  async addToField (selector, text) {
    await this.click(selector)
    await this.helpers.Puppeteer.page.keyboard.type(text)
  }

  async see (text, selector) {
    if (selector === undefined) {
      await _getElement.bind(this)('//*[text()="' + text + '"]')
    } else {
      if (selector.startsWith('/')) {
        await _getElement.bind(this)(selector + '//*[text()="' + text + '"]')
      } else {
        await _getElement.bind(this)(selector)
        await _seeElementText.bind(this)(selector, text)
      }
    }
  }

  async dontSee (text, selector) {
    if (selector === undefined) {
      await _getInvisibleElement.bind(this)('//*[text()="' + text + '"]')
    } else {
      if (selector.startsWith('/')) {
        await _getInvisibleElement.bind(this)(
          selector + '//*[text()="' + text + '"]'
        )
      } else {
        await _dontSeeElementText.bind(this)(selector, text)
      }
    }
  }

  async seeElement (selector, customWait) {
    await _getElement.bind(this)(selector, customWait)
  }

  async dontSeeElement (selector) {
    await _getInvisibleElement.bind(this)(selector)
  }

  async seeNumberOfElements (selector, number) {
    await _getElement.bind(this)(selector)
    await _seeNumberOfElements.bind(this)(selector, number)
  }

  async click (selector) {
    await _getElement.bind(this)(selector)
    await this.wait(waitForAction)
    await (await _getElement.bind(this)(selector)).click()
  }

  async clickOnElements (selector) {
    await _getElement.bind(this)(selector)
    await this.wait(waitForAction)
    let elements = await _getElements.bind(this)(selector)
    for (let i = 0; i < elements.length; i++) {
      await elements[i].click()
    }
  }

  async getNumberOfElements (selector) {
    if (selector.startsWith('/')) {
      return await (await this.helpers.Puppeteer.page.$x(selector)).length
    }
    return await (await this.helpers.Puppeteer.page.$$(selector)).length
  }

  async seeInUrl (url) {
    async function checkUrl () {
      return await this.helpers.Puppeteer.page
        .evaluate(() => {
          return document.URL
        })
        .catch(() => {})
    }
    for (let i = 0; i < errorWait * 2; i++) {
      let actualUrl = await checkUrl.bind(this)()
      if (typeof actualUrl === 'string') {
        if (actualUrl.includes(url)) {
          if (warningWait * 2 <= i) {
            outputWarning.push(
              `----------------------------------------
[Warning] - seeInUrl
Actual url "${actualUrl}"
Expected "${url}" is equal after ${i / 2} sec.
Scenario:	${this.scenarioName}
	----------------------------------------`
            )
          }
          return
        }
      }
      await this.wait(500)
    }
    this.throwError(
      `Actual url "${actualUrl}" is not equal with expected "${url}"`
    )
  }

  async dontSeeInUrl (url) {
    async function checkUrl () {
      return await this.helpers.Puppeteer.page
        .evaluate(() => {
          return document.URL
        })
        .catch(() => {})
    }
    for (let i = 0; i < errorWait * 2; i++) {
      let actualUrl = await checkUrl.bind(this)()
      if (typeof actualUrl === 'string') {
        if (!actualUrl.includes(url)) {
          if (warningWait * 2 <= i) {
            outputWarning.push(
              `----------------------------------------
[Warning] - dontSeeInUrl
Actual url "${actualUrl}"
Expected url "${url}" is not visible after ${i / 2} sec.
Scenario:	${this.scenarioName}
----------------------------------------`
            )
          }
          return
        }
      }
      await this.wait(500)
    }
    this.throwError(`Url "${actualUrl}" is visible ${this.networkStatus}`)
  }

  async getElementAttribute (selector, attribute) {
    await _getElement.bind(this)(selector)
    return await this.helpers.Puppeteer.page.evaluate(
      (selectorArg, attributeArg) => {
        return document.querySelector(selectorArg).getAttribute(attributeArg)
      },
      selector,
      attribute
    )
  }

  async drag (selectorMove, selectorSize, percentage) {
    await this.helpers.Puppeteer.page.evaluate(
      function (selectorMoveArgs, selectorSizeArgs, percentageArgs) {
        const sMove = document.querySelector(selectorMoveArgs)
        const position =
					document.querySelector(selectorSizeArgs).clientWidth /
						100 *
						percentageArgs +
					document.querySelector(selectorSizeArgs).getBoundingClientRect().left

        var createEvent = (type, pos) => {
          var event = document.createEvent('MouseEvents')
          event.initMouseEvent(
            type,
            true,
            true,
            window,
            1,
            1,
            1,
            pos,
            0,
            false,
            false,
            false,
            false,
            0,
            sMove
          )
          sMove.dispatchEvent(event)
        }
        createEvent('mousedown', position)
        createEvent('mouseup', 0)
      },
      selectorMove,
      selectorSize,
      percentage
    )
  }

  async scrollIntoView (selector) {
    await this.helpers.Puppeteer.page.evaluate(selectorArg => {
      document.querySelector(selectorArg).scrollIntoView()
    }, selector)
  }

  // async clickInIframe(iframe, selector) {
  // 	const frames = await page.frames()
  // 	for (let i = 0; i < frames.length; i++) {
  // 		outputWarning.push(frames.name)
  // 	}
  // }
}

// -------------------Functions--------------------
async function _getElement (selector, customWait) {
  let waiting = (customWait || errorWait) * 2
  async function searchElement () {
    if (selector.startsWith('/')) {
      return (await this.helpers.Puppeteer.page.$x(selector))[0]
    }
    return await this.helpers.Puppeteer.page.$(selector)
  }
  for (let i = 0; i < waiting; i++) {
    let element = await searchElement.bind(this)()
    if (element !== undefined && element !== null) {
      if (warningWait * 2 <= i) {
        outputWarning.push(
          `----------------------------------------
[Warning] - getElement
Selector: "${selector}"
was found after ${i / 2} sec.
Scenario: ${this.scenarioName}
----------------------------------------`
        )
      }
      return element
    }
    await this.wait(500)
  }
  await this.throwError(`Selector "${selector}" was not found`)
  return null
}

async function _getInvisibleElement (selector) {
  async function searchElement () {
    if (selector.startsWith('/')) {
      return (await this.helpers.Puppeteer.page.$x(selector))[0]
    }
    return await this.helpers.Puppeteer.page.$(selector)
  }
  for (let i = 0; i < errorWait * 2; i++) {
    let element = await searchElement.bind(this)()
    if (element === undefined || element === null) {
      if (warningWait * 2 <= i) {
        outputWarning.push(
          `----------------------------------------
[Warning] - getInvisibleElement
Selector: "${selector}"
is still visible after ${i / 2} sec.
Scenario:	${this.scenarioName}
----------------------------------------`
        )
      }
      return
    }
    await this.wait(500)
  }
  this.throwError(`Selector "${selector}" is still visible`)
}

async function _seeElementText (selector, text) {
  async function searchElement () {
    return await this.helpers.Puppeteer.page.$eval(
      selector,
      (a, textArgs) => a.innerText.includes(textArgs),
      text
    )
  }
  for (let i = 0; i < errorWait * 2; i++) {
    if (await searchElement.bind(this)()) {
      if (warningWait * 2 <= i) {
        outputWarning.push(
          `----------------------------------------
[Warning] - seeElementText
Expected text "${text}"
is visible in selector "${selector}" after ${i / 2} sec.
Scenario:	${this.scenarioName}
----------------------------------------`
        )
      }
      return
    }
    await this.wait(500)
  }
  this.throwError(
    `Expected text "${text}" is not visible in selector "${selector}"`
  )
}

async function _dontSeeElementText (selector, text) {
  async function searchElement () {
    return await this.helpers.Puppeteer.page.$eval(
      selector,
      (a, textArgs) => a.innerText.includes(textArgs),
      text
    )
  }
  for (let i = 0; i < errorWait * 2; i++) {
    if (!await searchElement.bind(this)()) {
      if (warningWait * 2 <= i) {
        outputWarning.push(
          `----------------------------------------
[Warning] - dontSeeElementText
Expected text "${text}"
is not visible in selector "${selector}" after ${i / 2} sec.
Scenario:	${this.scenarioName}
----------------------------------------`
        )
      }
      return
    }
    await this.wait(500)
  }
  this.throwError(
    `Expected text "${text}" is visible in selector "${selector}"`
  )
}

async function _seeNumberOfElements (selector, number) {
  async function searchElement () {
    if (selector.startsWith('/')) {
      return (await this.helpers.Puppeteer.page.$x(selector)).length
    }
    return (await this.helpers.Puppeteer.page.$$(selector)).length
  }
  for (let i = 0; i < errorWait * 2; i++) {
    let actualNumber = await searchElement.bind(this)()
    if (actualNumber === number) {
      if (warningWait * 2 <= i) {
        outputWarning.push(
          `----------------------------------------
[Warning] - seeNumberOfElements
Selector "${selector}"
Expected count "${number}"
is visible after ${i / 2} sec.
Scenario: ${this.scenarioName}
----------------------------------------`
        )
      }
      return
    }
    await this.wait(500)
  }
  this.throwError(
    `See number of Elements selector "${selector}" expected count "${number}" is not equal with actual count ${actualNumber}`
  )
}

async function _getElements (selector) {
  if (selector.startsWith('/')) {
    return await this.helpers.Puppeteer.page.$x(selector)
  }
  return await this.helpers.Puppeteer.page.$$(selector)
}
