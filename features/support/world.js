import { expect } from 'chai'
import { setWorldConstructor, setDefaultTimeout } from 'cucumber'
import PAGE from './builder'
const url = 'http://todomvc.com/examples/react/#/'
const ENTER_EVENT = 'Enter'
const INPUT_SELECTOR = 'section input'
const TODO_ITEMS_SELECTOR = 'ul.todo-list li'
const todoItemSelector = index => `ul.todo-list li:nth-child(${index})`
const todoItemLabelSelector = index => `${todoItemSelector(index)} label`
const deleteButtonSelector = index => `${todoItemSelector(index)} button`
const errorWait = 15 // in sec
// const warningWait = 4 // in sec
const waitForAction = 170 // in ms

setDefaultTimeout(30 * 1000)

/**
  * @desc this class "World" will hold helper functions related to the scenarios
  * examples login with , search for scren, click in sideBar
  * @author amine.fredj@neoxam.com
  * @required builder
*/

class World {
  async openPage () {
    this.page = await PAGE.build('Desktop')
    await this.page.goto(url)
  }

  async writeTodo (todo) {
    await this.page.waitForSelector(INPUT_SELECTOR)
    this.inputElement = await this.page.$(INPUT_SELECTOR)
    await this.inputElement.type(todo)
    await this.inputElement.press(ENTER_EVENT)
  }

  throwError (description) {
    throw new Error(description + ' ' + this.networkStatus)
  }

  async checkNumberOfTodos (number) {
    const todoItemCount = await this.page.$$eval(
      TODO_ITEMS_SELECTOR,
      items => items.length
    )
    expect(todoItemCount).to.eql(parseInt(number))
  }

  async checkTodoIsInList (todoIndex, todo) {
    const foundTodo = await this.page.$eval(
      todoItemLabelSelector(todoIndex),
      el => el.textContent.trim()
    )
    expect(foundTodo).to.eql(todo)
  }

  async deleteTodo (todoIndex) {
    await this.page.hover(todoItemSelector(todoIndex))
    await this.page.click(deleteButtonSelector(todoIndex))
  }

  async closePage () {
    await this.page.close()
  }

  async refreshPage () {
    await this.page.reload()
  }

  async wait (timeMs) {
    await new Promise(resolve => {
      setTimeout(() => resolve(), timeMs)
    })
  }

  async fillField (selector, text) {
    await this.click(selector)
    await this.page.keyboard.down('Control')
    await this.page.keyboard.press('a')
    await this.page.keyboard.press('Backspace')
    await this.page.keyboard.up('Control')
    await this.page.keyboard.type(text)
    await this.page.keyboard.type(ENTER_EVENT)
  }

  async addToField (selector, text) {
    await this.click(selector)
    await this.page.keyboard.type(text)
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
      const res = await (await this.page.$x(selector)).length
      return res
    }
    const res = await (await this.page.$$(selector)).length
    return res
  }
}
async function _getElement (selector, customWait) {
  let waiting = (customWait || errorWait) * 2
  async function searchElement () {
    if (selector.startsWith('/')) {
      return (await this.page.$x(selector))[0]
    }
    // eslint-disable-next-line no-return-await
    return await this.page.$(selector)
  }
  for (let i = 0; i < waiting; i++) {
    let element = await searchElement.bind(this)()
    if (element !== undefined && element !== null) {
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
      return (await this.page.$x(selector))[0]
    }
    // eslint-disable-next-line no-return-await
    return await this.page.$(selector)
  }
  for (let i = 0; i < errorWait * 2; i++) {
    let element = await searchElement.bind(this)()
    if (element === undefined || element === null) {
      return
    }
    await this.wait(500)
  }
  this.throwError(`Selector "${selector}" is still visible`)
}

async function _seeElementText (selector, text) {
  async function searchElement () {
    const res = await this.page.$eval(
      selector,
      (a, textArgs) => a.innerText.includes(textArgs),
      text
    )
    return res
  }
  for (let i = 0; i < errorWait * 2; i++) {
    if (await searchElement.bind(this)()) {
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
    // eslint-disable-next-line no-return-await
    return await this.page.$eval(
      selector,
      (a, textArgs) => a.innerText.includes(textArgs),
      text
    )
  }
  for (let i = 0; i < errorWait * 2; i++) {
    if (!await searchElement.bind(this)()) {
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
  let actualNumber
  for (let i = 0; i < errorWait * 2; i++) {
    actualNumber = await searchElement.bind(this)()
    if (actualNumber === number) {
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
    // eslint-disable-next-line no-return-await
    return await this.helpers.Puppeteer.page.$x(selector)
  }
  // eslint-disable-next-line no-return-await
  return await this.helpers.Puppeteer.page.$$(selector)
}
setWorldConstructor(World)
