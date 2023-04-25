interface FastWindowClicker {
    clickPurchase(price: number, windowId: number): void
    clickBedPurchase(price: number, windowId: number): void
    clickConfirm(price: number, itemName: string, windowId: number): void
    onAuctionWasAlreadyBought(): void
    getLastWindowId(): number
}
