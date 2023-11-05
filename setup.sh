sudo apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 20
nvm use 20
npm i
echo "run bash ./start in root dir to start PLEASE READ THIS this means that as soon as you are in VPS type bash ./start" 
echo "cd auto-flipper && npm start" > ../start
