import readline from 'readline'

import formatProduction from './util/formatProduction.js'
import isValidProduction from './util/isValidProduction.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const productions = []
let grammar = {}
const firstSets = {}
const followSets = {}

const calculateFirstSets = () => {
    const nonTerminals = Object.keys(grammar)
    Object.entries(grammar).forEach(([lhs, rhs]) => {
        firstSets[lhs] = []
        rhs.forEach((r) => {
            if (!firstSets[lhs].includes(r[0])) {
                firstSets[lhs].push(r[0])
            }
        })
    })
    const nonTerminalInFirst = Object.values(firstSets)
        .toString()
        .split(',')
        .some((item) => {
            return nonTerminals.includes(item)
        })
    calculateFirstSetsRecursive(nonTerminals, nonTerminalInFirst)
}

const calculateFirstSetsRecursive = (nonTerminals, nonTerminalInRHS) => {
    if (nonTerminalInRHS) {
        Object.entries(firstSets).forEach(([lhs, first]) => {
            const rhs = []
            first.forEach((item) => {
                if (nonTerminals.includes(item)) {
                    for (let i = 0; i < firstSets[item].length; i++) {
                        if (
                            !rhs.includes(firstSets[item][i]) &&
                            lhs !== firstSets[item][i]
                        ) {
                            rhs.push(firstSets[item][i])
                        }
                    }
                } else if (!rhs.includes(item)) {
                    rhs.push(item)
                }
            })
            firstSets[lhs] = rhs.flat()
        })
        const nonTerminalInFirst = Object.values(firstSets)
            .toString()
            .split(',')
            .some((item) => {
                return nonTerminals.includes(item)
            })
        return calculateFirstSetsRecursive(nonTerminals, nonTerminalInFirst)
    } else {
        calculateFollowSets(nonTerminals)
    }
}

const calculateFollowSets = (nonTerminals) => {
    followSets['_start_'] = ['$']
    Object.entries(grammar).forEach(([lhs, _rhs]) => {
        if (lhs !== '_start_') {
            followSets[lhs] = []
        }
    })
    Object.entries(grammar).forEach(([lhs, rhs]) => {
        rhs.forEach((item) => {
            for (let i = 0; i < item.length; i++) {
                const follow = []
                if (nonTerminals.includes(item[i])) {
                    if (item[i + 1]) {
                        follow.push(firstSets[item[i + 1]] ?? item[i + 1])
                        if (
                            firstSets[item[i + 1]] &&
                            firstSets[item[i + 1]].includes('_') &&
                            !followSets[item[i]].includes(`FOLLOW(${lhs})`) &&
                            lhs !== item[i]
                        ) {
                            follow.push(`FOLLOW(${lhs})`)
                        }
                    } else if (lhs !== item[i]) {
                        follow.push(`FOLLOW(${lhs})`)
                    }
                    const filtered = follow
                        .flat()
                        .filter((item) => item !== '_')
                    if (follow.length) {
                        followSets[item[i]] = [
                            ...new Set([
                                ...followSets[item[i]].flat(),
                                ...filtered,
                            ]),
                        ]
                    }
                }
            }
        })
    })
    const followInSet = Object.values(followSets)
        .toString()
        .split(',')
        .some((item) => item.startsWith('FOLLOW('))
    calculateFollowSetsRecursive(followInSet)
}

const calculateFollowSetsRecursive = (followInSet) => {
    if (followInSet) {
        Object.entries(followSets).forEach(([lhs, follow]) => {
            const rhs = []
            follow.forEach((item) => {
                if (/^FOLLOW\(.+\)$/.test(item)) {
                    const followLhs = item
                        .replace(/^FOLLOW\(/, '')
                        .replace(/\)/, '')
                    rhs.push(
                        ...followSets[followLhs].filter(
                            (item) =>
                                item ===
                                item.replace(/^FOLLOW\(/, '').replace(/\)/, '')
                        )
                    )
                } else {
                    rhs.push(item)
                }
                followSets[lhs] = rhs.flat()
            })
        })

        const followInSet = Object.values(followSets)
            .toString()
            .split(',')
            .some((item) => item.startsWith('FOLLOW('))
        return calculateFollowSetsRecursive(followInSet)
    } else {
        // next step
    }
    console.log('Follow Sets: ', followSets)
}

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
    updatedGrammar['_start_'] = [Object.keys(grammar)[0]]
    Object.entries(grammar).forEach(([lhs, rhs]) => {
        const recursiveProductions = []
        const nonRecursiveProductions = []
        rhs.forEach((r) => {
            if (lhs === r[0]) {
                recursiveProductions.push([...r])
            } else {
                nonRecursiveProductions.push([...r])
            }
        })
        updatedGrammar[lhs] = [...nonRecursiveProductions]
        if (recursiveProductions.length > 0) {
            updatedGrammar[lhs] = nonRecursiveProductions.map((item) => {
                const copy = [...item]
                if (copy[0] === '_') {
                    copy.shift()
                }
                copy.push(`${lhs}_rr`)
                return copy
            })
            updatedGrammar[`${lhs}_rr`] = recursiveProductions.map((item) => {
                const copy = [...item]
                copy.shift()
                copy.push(`${lhs}_rr`)
                return copy
            })
            updatedGrammar[`${lhs}_rr`].push(['_'])
        }
    })
    grammar = updatedGrammar
    console.log(grammar)
    calculateFirstSets()
}

const splitProductions = () => {
    let splitProductions = []

    productions.forEach((item) => {
        const [lhs, rhs] = item.split(':')
        rhs.split('|').forEach((i) => {
            splitProductions.push(JSON.stringify([lhs, i]))
        })
    })
    splitProductions = [...new Set(splitProductions)].map((item) => {
        return JSON.parse(item)
    })

    splitProductions.forEach(([lhs, rhs]) => {
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
