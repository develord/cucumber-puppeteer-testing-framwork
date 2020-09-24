import { After, Before, Given, Then, When } from 'cucumber'

Before(async function (testCase) {
  await this.openPage()
})

After(async function () {
  await this.closePage()
})

Given('I have the todo list', async function (dataTable) {
  const rows = dataTable.rows()
  for (let index = 0; index < rows.length; index++) {
    await this.fillField(rows[index][0], 'ddddddddddddd')
  }
})
