export function toNumber(value, decimal = 12) {
    const regex = new RegExp(`^-?\\d+(?:\\.\\d{0,${decimal}})?`)
    const val = Number(value.toString().match(regex)[0])
    return val < 0.1 ** Math.max(decimal - 5, 2) ? 0 : val
}