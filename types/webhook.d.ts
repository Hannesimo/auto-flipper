interface Webhook {
    content: string
    username?: string
    avatar_url: string
    tts: boolean
    embeds?: Array<Embed>
}

interface Embed {
    title: string
    description?: string
    url?: string
    timestamp?: number
    color?: number
    footer?: EmbedFooter
    image?: string
    thumbnail?: EmbedThumbnail
    author?: EmbedAuthor
    fields?: Array<EmbedField>
}

interface EmbedFooter {
    text: string
    icon_url?: string
}

interface EmbedAuthor {
    name: string
    url?: string
    icon_url?: string
}

interface EmbedField {
    name: string
    value: string
    inline: boolean
}

interface EmbedThumbnail {
    url: string
    proxy_url?: string
    height?: number
    width?: number
}
