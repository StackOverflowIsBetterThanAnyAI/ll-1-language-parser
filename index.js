import readline from 'readline'

import formatProduction from './util/formatProduction.js'
import isValidProduction from './util/isValidProduction.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const productions = []
let grammar = {}

const enterProductions = () => {
    rl.question('Enter a production: ', (input) => {
        if (!isValidProduction(input)) {
            console.log(
                `No valid production found for ${input}. Please try again.`
            )
            enterProductions()
        } else {
            productions.push(formatProduction(input))
            enterAdditionalProductions()
        }
    })
}

const enterAdditionalProductions = () => {
    rl.question('Enter another production or type "done": ', (input) => {
        if (input.toLowerCase() === 'done') {
            enterWordToBeParsed()
        } else if (!isValidProduction(input)) {
            console.log(
                `No valid production found for ${input}. Please try again.`
            )
            enterAdditionalProductions()
        } else {
            productions.push(formatProduction(input))
            enterAdditionalProductions()
        }
    })
}

const enterWordToBeParsed = () => {
    rl.question('Please enter the word to be parsed: ', (input) => {
        splitProductions()
    })
}

const productionInstructions = () => {
    console.log('Please enter your productions in the following format:')
    console.log('')
    console.log("S → A'Ab | ε   corresponds to   S: A'Ab | _")
    console.log('')
    console.log(
        'Please type in the productions one after the other and confirm each one with ENTER'
    )
}

const removeDirectLeftRecursion = () => {
    const updatedGrammar = {}
    Object.entries(grammar).map(([lhs, rhs]) => {
        const recursiveProductions = []
        const nonRecursiveProductions = []
        rhs.map((r) => {
            if (lhs.charAt(0) === r[0]) {
                recursiveProductions.push([...r])
            } else {
                nonRecursiveProductions.push([...r])
            }
        })
        updatedGrammar[lhs] = nonRecursiveProductions
        if (recursiveProductions.length > 0) {
            grammar[`${lhs}'`] = []
            updatedGrammar[lhs] = nonRecursiveProductions.map((item) => {
                const copy = [...item]
                if (copy[0] === '_') {
                    copy.shift()
                }
                copy.push(`${lhs}'`)
                return copy
            })
            updatedGrammar[`${lhs}'`] = recursiveProductions.map((item) => {
                const copy = [...item]
                copy.shift()
                copy.push(`${lhs}'`)
                return copy
            })
            updatedGrammar[`${lhs}'`].push(['_'])
        }
    })
    grammar = updatedGrammar
    console.log(grammar)
}

const splitProductions = () => {
    let splitProductions = []

    productions.map((item) => {
        const [lhs, rhs] = item.split(':')
        rhs.split('|').map((i) => {
            splitProductions.push(JSON.stringify([lhs, i]))
        })
    })
    splitProductions = [...new Set(splitProductions)].map((item) => {
        return JSON.parse(item)
    })

    splitProductions.map(([lhs, rhs]) => {
        const symbols = rhs.split('')
        if (!grammar[lhs]) grammar[lhs] = []
        grammar[lhs].push(symbols)
    })
    removeDirectLeftRecursion()
}

const main = () => {
    productionInstructions()
    enterProductions()
}

main()
