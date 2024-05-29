interface Sequence {
    steps: {
        type: 'execute' | 'click' | 'upload' | 'close'
        data: string
    }[]
}
