sudo apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 20
nvm use 20
npm i
echo "run ./start 
echo "echo 'to stop BAF please hold control and click the letter C on your keyboard' && cd auto-flipper && npm start" > ../start.sh
