

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: '0.8.0',
  networks: {
    rinkeby: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/5knCTQoFdcQc0gMsya7DpqKmNfT8jZKn',
      accounts: ['adb57ca905510a86061316608261056fbdb6e095615c37fc81bf835356f2bcc3']
    }
  }
}