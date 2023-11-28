# Best Auto Flipper (BAF) for Hypixel Skyblock

**Note: This code is a headless (no user interface) Minecraft client with features sending custom packages to the server to compete with other macroers. This is against the Hypixel Terms of Service, and you will be banned if caught using it.**

## Is this bannable?

Yes, BAF is against the TOS of Hypixel. It is recommended not to use it if you don't want to risk a ban.

## Is this a RAT?

No, BAF is not a rat. You can check the code yourself. The bot itself doesn't touch your credentials. It uses the authentication API of MineFlayer to handle that. As far as I am aware, mineflayer only stores the credentials in `.minecraft/nmp-cache`. If you want to connect a different account or remove the stored credentials for some other reason, [remove this folder](https://github.com/PrismarineJS/mineflayer/discussions/2392).

## Requirements

- The bot teleports to your island. You will need an active **Booster Cookie** to purchase auctions outside of the hub.
- The bot does not take money out of your bank, so make sure to have coins in your purse.
- Purchased flips may stay in the inventory for a while before being relisted. Make sure to have inventory space so you don't fill up your inventory after a few flips.

## Getting Started

### Executable

For Windows, there is a PowerShell-Script called `BAF.ps1`. This script automatically downloads/updates BAF, and starts the newest version from GitHub, saving it at `%appdata$/BAF`. Created files (like the config and log file) are also stored there. You can execute it by right-clicking and pressing `Run with PowerShell`.

You can also paste the following command into PowerShell to run the script: `Invoke-Expression (New-Object System.Net.WebClient).DownloadString("https://raw.githubusercontent.com/Hannesimo/auto-flipper/master/start_script/BAF.ps1`. This command downloads the Script and executes it.

If you want to start the .exe yourself, make sure to open the PowerShell and execute the program with `./BAF-[version]-win.exe`. Don't run it by simply double clicking the file, as it will use the Windows CMD, of which seems to have an internal issue with the npm minecraft-protocol package, causing the bot to timeout after a while.

Tutorial on how to open PowerShell: https://www.youtube.com/watch?v=aLwq9AggFw8&t=1s

For Mac/Linux just execute the corresponding files as usual. I am not aware of similar issues there.

### Node

1. Get Node
 You can install it from https://nodejs.org/en/download
2. Get the source code
 Go to https://github.com/Hannesimo/auto-flipper and click the green `Code` then `Download ZIP`. Unzip the folder somewhere.
3. Start BAF with node
 Open the unzipped folder in explorer, make sure you see multiple files and not another folder.
 Open command prompt by clicking on the address bar, writing cmd and pressing enter ([video explanation)](https://www.youtube.com/watch?v=bgSSJQolR0E&t=47s). Make sure to paste this command: `npm i && npm run start` and press enter.

You should now be asked for setup information by BAF. Note that you will have to repeat step 2 and 3 in order to update it.
You can also open the code in a text editor and make adjustments. To start after the first setup you only need `npm run start`.

### Linux
To execute BAF on Linux, use the following commands(and follow the input requests).
```bash
version=1.1.5
wget -c https://github.com/Hannesimo/auto-flipper/releases/download/$version/BAF-$version-linux
chmod +x BAF-$version-linux 
./BAF-$version-linux
```

## How does BAF work?

-   On the first start, enter your in game name. This is needed for the authentication.
-   Connect your Minecraft account by posting the link the bot gives you into your browser.
-   After you are authenticated, the bot should join Hypixel and teleports itself to your island.
-   After that, it automatically buys and sells flips.
-   Profit!

## Configuration

The bot creates a `config.toml` file after the first start. This file contains configuration properties for the bot. Currently, only the ingame username is stored, so you don't need to enter it every time. I may add more configurations in the future. The Cofl configurations apply as normal.
<br/> **NOTE**: The mod uses the Median price (minus a bit to sell faster) to auto-sell.

## System Requirements

-   Any operating system
-   500MB of RAM
-   1 core on your CPU
-   Stable ping, preferably under 200ms (BAF measures your ping and sends actions ahead of time to arrive as close to on time as possible)
-   **Some paid plan from [Cofl](sky.coflnet.com).**

## Webhook

You can add a Webhook URL into your `config.toml`` to get different notifications (init, selling, purchasing, and relisting).
Just add the line `WEBHOOK_URL = "YOUR_URL"` into your config. Make sure to place it above the sessions part (will be created automatically on your first start).

## Logging

If there is something wrong with the bot and you plan to report it, please add your log file.