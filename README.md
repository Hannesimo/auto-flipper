Join the official Discord server:
https://www.discord.gg/eYRBsaECzY

# BAF

You found the Best Auto Flipper (BAF) for hypixel Skyblock
Note: This code is a headless (no user interface) Minecraft client and has features sending custom packages to the server to compete with other macroers. This is against the Hypixel Terms of Service.
Hypixel currently doesn't ban for doing so but has all the rights to start doing it without notice so use this with caution.

## Is this bannable

Yes, it is against the TOS of Hypixel, so don't use it if you don't want to risk that.

## Is this a RAT

No, you can check the code yourself. The bot itself doesn't touch your credentials it uses the authentication API of mineflayer to handle that.
As far as I am aware mineflayer only stores the credentials in `.minecraft/nmp-cache`. So if you want to connect a different account or remove the stored credentials for some other reason, remove this folder. (https://github.com/PrismarineJS/mineflayer/discussions/2392)

## Requirements

-   The bot teleports you to your island. You need an active Booster Cookie to purchase auctions outside of the hub.
-   The bot does not take money out of your bank, so make sure to have coins in your purse
-   Purchased flips may stay in the inventory for a bit before being relisted. Make sure to have some space so you don't fill up your inventory after a few flips.

## Getting Started

### Executable

For Windows there is a PowerShell-Script "BAF.ps1". This script automatically downloads/updates and starts the newest version from GitHub and saves it at `%appdata$/BAF`. Created files like the config and log file are also stored there. You can execute it by right-clicking and "Run with PowerShell".

You can also paste this command into the PowerShell to run the script: `Invoke-Expression (New-Object System.Net.WebClient).DownloadString("https://raw.githubusercontent.com/Hannesimo/auto-flipper/master/start_script/BAF.ps1`. This command downloads the Script and executes it.

If you want to start the .exe yourself, make sure to open the PowerShell and execute the program with `./BAF-[version]-win.exe`. Don't just run it by double clicking as it will use the Windows CMD and there seems to be an internal issue with the npm minecraft-protocol package and CMD causing the bot to timeout after a while.

Tutorial on how to open PowerShell: https://www.youtube.com/watch?v=aLwq9AggFw8&t=1s

For Mac/Linux just execute the corresponding files as usual. I am not aware of similar issues there.

### Node

To run or build the code, you need Node and npm.

-   To run it just execute `npm install` followed by `npm run start`<br/><br/>
-   To build the executables the following command for the following OS:
    -   Windows: `npm run build-executables-win`
    -   Linux: `npm run build-executables-linux`

NOTE: You only need this if you want to build the code yourself. If you are using a executable, you can ignore the node steps.

### Linux
To execute on linux use the following (and follow the input requests)
```bash
version=1.1.0
wget -c https://github.com/Hannesimo/auto-flipper/releases/download/$version/BAF-$version-linux
chmod +x BAF-$version-linux 
./BAF-$version-linux
```

## How does it work

-   On the first start, enter your Ingame name, this is needed for the authentication
-   Connect your Minecraft account by posting the link the bot gives you into your browser
-   After you are authenticated, the bot should join Hypixel and teleports itself to your island
-   After that, it automatically buys and sells flips
-   => Profit

## Configuration

The bot creates a config.toml file after the first start. This file contains configuration properties for the bot. Currently, only the ingame username is stored, so you don't need to enter it every time. I may add more configurations in the future. The Cofl configurations apply as normal.
<br/> NOTE: The mod uses the Median price (minus a bit to sell faster) to auto-sell

## System Requirements

-   Any operating system
-   500MB of RAM
-   1 core of your CPU
-   Stable ping, preferably under 200ms - it measures your ping and sends actions ahead of time to arrive as close on time as possible
-   Some paid plan from sky.coflnet.com

## Webhook

You can add a Webhook URL into your config.toml to get different notifications (init, selling, purchasing, relisting).
Just add the line `WEBHOOK_URL = "YOUR_URL"` into your config. Make sure to place it above the sessions part (will be created automatically on your first start).

## Logging

If there is something wrong with the bot and you plan to report it, please add your log file
