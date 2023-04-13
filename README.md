# BAF

This bot fully automatically purchases, relists and claims flips using your Cofl connection. The settings and black-/whitelist you set in Cofl apply for the bot as well.

## Is this bannable

Yes, it is against the TOS of Hypixel, so don't use it if you don't want to risk that.

## Is this a RAT

No, you can check the code yourself. The bot itself doesnt touch your credentials it uses the authentication API of mineflayer to handle that.
As far as I am aware mineflayer only stores the credentials in `.minecraft/nmp-cache`. So if you want to connect a different account or remove the stored credentials for some other reason, remove this folder. (https://github.com/PrismarineJS/mineflayer/discussions/2392)

## Requirements

-   The bot teleports you to your island. You need a active Booster Cookie to purchase auctions outside of the hub.
-   The bot does not take money out of your bank, so make sure to have coins in your purse
-   Purchased flips may stay in the inventory for a bit before being relisted. Make sure to have some space so you don't fill up your inventory after a few flips.

## How does it work

-   Connect your Minecraft account by posting the link the bot gives you into your browser
-   After you are authenticated, the bot should join Hypixel and tries to go to your island
-   After that it automatically buy and sells flips
-   => Profit

# Running / Building

To run the code yourself just run `npm install` followed by `npm run start`
To build the executables just run `npm install` followed by `npm run build-executables`
