require('dotenv').config();

const ANDREANI = {
  user: process.env.ANDREANI_USER || 'testinternoqa_gla',
  pass: process.env.ANDREANI_PASS || 'iqVsIeR0q6voXcrs7HDV!',
  clientCode: process.env.ANDREANI_CLIENT_CODE || 'CL0003750',
  contractDom: process.env.ANDREANI_CONTRACT_DOM || '400006709',
  contractSuc: process.env.ANDREANI_CONTRACT_SUC || '400006711',
  baseUrl: 'https://api.andreani.com'   // 👈 producción/sandbox real
};

module.exports = ANDREANI;

