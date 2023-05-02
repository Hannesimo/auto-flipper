import axios from "axios";
import { log } from "./logger";

export class WebhookConstructor {
    webhookData: Webhook
    constructor(webhook?) {
        if(webhook) this.webhookData = webhook as Webhook;
        else this.webhookData = {} as Webhook;
    }

    setContent(text: string) {
        this.webhookData.content = text;
        return this;
    }

    setUsername(username: string) {
        this.webhookData.username = username;
        return this;
    }

    setAvatar(url: string) {
        this.webhookData.avatar_url = url;
        return this;
    }

    setTTS(choice: boolean) {
        this.webhookData.tts = choice;
        return this;
    }

    addEmbeds(embeds: Array<EmbedConstructor>) {
        let embedsData = embeds.map(x => x.embedData);
        this.webhookData.embeds = embedsData;
        return this;
    }
}

export class EmbedConstructor {
    embedData: Embed
    constructor(embed?) {
        if(embed) this.embedData = embed as Embed;
        else this.embedData = {} as Embed;
    }
    
    setTitle(text: string) {
        this.embedData.title = text;
        return this;
    }

    setDescription(text: string) {
        this.embedData.description = text;
        return this;
    }

    setURL(text: string) {
        this.embedData.url = text;
        return this;
    }

    setTimestamp(time?: number) {
        if(!time) this.embedData.timestamp = Date.now()
        else this.embedData.timestamp = time;
        return this;
    }
    
    // To show a hexadecimal color use 0x instead of # (e.g: 0x00ffaa)
    setColor(color?: number) {
        if(!color) this.embedData.color = color;
        else this.embedData.color = null;
        return this;
    }

    setFooter(footer: EmbedFooter) {
        this.embedData.footer = footer;
        return this;
    }

    setImage(image: string) {
        this.embedData.image = image;
        return this;
    }

    setThumbnail(thumbnail: EmbedThumbnail) {
        this.embedData.thumbnail = thumbnail;
        return this;
    }

    setAuthor(author: EmbedAuthor) {
        this.embedData.author = author;
        return this;
    }

    setFields(fields: Array<EmbedField>) {
        this.embedData.fields = fields;
        return this;
    }
}

export default async function sendWebhook(url:string, webhook: WebhookConstructor) {
    await axios.post(url, webhook.webhookData).then(() => log("Webhook sent :D"))
}
