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
}

setWorldConstructor(World)
