export function numberWithThousandsSeparators(number?: number): string {
    if (!number) {
        return '0'
    }
    var parts = number.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}
