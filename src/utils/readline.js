const readline = require('readline')

module.exports = {
  createInterface () {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  },
  question (rl, question) {
    return new Promise((resolve) => {
      rl.question(question, (input) => {
        resolve(input)
      })
    })
  }
}