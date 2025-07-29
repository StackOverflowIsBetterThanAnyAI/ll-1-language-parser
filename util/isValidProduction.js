const isValidProduction = (input) => {
    return /^[A-Z]:\s*[^|\|\s]+[^|]*(\s*\|\s*[^|\|\s]+[^|]*)*\s*$/.test(input)
}

export default isValidProduction
