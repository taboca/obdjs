const net = require('net');
const codes = require('./pcodes');

const HOST = '192.168.0.10';
const PORT = 35000;

// const client = net.createConnection(PORT, HOST);

//Sample 01 01:
// 81 07 65 04
//Sample 03:
// 48 6B 09 43 04 20 01 39 00 00 5D
//Sample 01 00:
// BE1FA813

const sample_response = '48 6B 09 43 04 20 01 39 00 00 5D';

const startupSequence = () => {
    client.write('ATZ\r\n\0');
    setTimeout(client.write('ATE0\r\n\0'), 1000);
    setTimeout(client.write('ATH1\r\n\0'), 1500);
    setTimeout(client.write('ATL1\r\n\0'), 2000);
}


const bitIndexer = ['A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1', 'B0', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1', 'C0', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];

const bit = (pos) => {
  return bitIndexer.indexOf(pos);
}

const statusSinceDTCCleared = (hexArray) => {
  const hexstring = hexArray.join('');
  console.log("MIL: ", hexstring[0]);
  console.log("DTC_CNT: ", hexstring[1]);
  console.log("COMPONENTS: ", hexstring[bit('B2')], hexstring[bit('B6')]);
  console.log("FUEL SYSTEM: ", hexstring[bit('B1')], hexstring[bit('B5')]);
  console.log("MISFIRE: ", hexstring[bit('B0')], hexstring[bit('B4')]);
  console.log("EGR SYSTEM: ", hexstring[bit('C7')], hexstring[bit('D7')]);
  console.log("OXYGEN SENSOR HEATER: ", hexstring[bit('C6')], hexstring[bit('D6')]);
  console.log("OXYGEN SENSOR: ", hexstring[bit('C5')], hexstring[bit('D5')]);
  console.log("AC REFRIGERANT: ", hexstring[bit('C4')], hexstring[bit('D4')]);
  console.log("SECONDARY AIR SYSTEM: ", hexstring[bit('C3')], hexstring[bit('D3')]);
  console.log("EVAPORATIVE SYSTEM: ", hexstring[bit('C2')], hexstring[bit('D2')]);
  console.log("HEATED CATALYST: ", hexstring[bit('C1')], hexstring[bit('D1')]);
  console.log("CATALYST: ", hexstring[bit('C0')], hexstring[bit('D0')]);
  console.log("EGR / VVT SYSTEM: ", hexstring[bit('C7')], hexstring[bit('D7')]);
  console.log("PM FILTER MONITORING: ", hexstring[bit('C6')], hexstring[bit('D6')]);
  console.log("EXHAUST GAS SENSOR: ", hexstring[bit('C5')], hexstring[bit('D5')]);
  console.log("BOOST PRESSURE: ", hexstring[bit('C4')], hexstring[bit('D4')]);
  console.log("NOX / SCR MONITOR: ", hexstring[bit('C1')], hexstring[bit('D1')]);
  console.log("NMHC CATALYST: ", hexstring[bit('C0')], hexstring[bit('D0')]);

}

const hexToByteArray = (hex) => {
  hex = hex.replace(/\s/g, '');
  const splitHex = hex.match(/.{1,2}/g);
  const byteArray = [];
  for (byte in splitHex) {
    const byteString = Hex2Bin(splitHex[byte]).toString();
    if (byteString.length < 8){
      const discrepancy = byteString.length;
      for (const i = 0; i < (8 - discrepancy); i++) {
        const splitBytes = byteString.split('');
        splitBytes.unshift('0');
        byteString = splitBytes.join('');
      }
    }
    byteArray.push(byteString);
  }
  console.log("Byte Array: ", byteArray);
  return byteArray;
}

const decodeMPH = (a) => {
  return a;
}

const decodeRPM = (a, b) => {
  return (256 * a + b) / 2;
}

const interpretDTCodes = (hex) => {
    const pcodeArray = hexToByteArray(hex);
    if (pcodeArray[0] === '01001000' && pcodeArray[1] === '01101011'){
      pcodeArray.shift();
      pcodeArray.shift();
    }
    const iteratorLimit = pcodeArray.length;
    const CurrentDTCodes = [];
    for (const i = 0; i < iteratorLimit / 2; i++){
      const pcodeBytes = pcodeArray.slice(i * 2, i * 2 + 2).join('');
      const DTCode = DTCodeMapper(pcodeBytes);
      if (DTCode){
        CurrentDTCodes.push(DTCode);
      }
    }
    return  CurrentDTCodes;
}

const DTCodeMapper = (twobytestring) => {
    const twobyte = twobytestring.split('');
    const firstCharByte = twobyte.slice(0, 2).join('');
    const secondCharByte = twobyte.slice(2, 4).join('');
    const thirdCharByte = twobyte.slice(4, 8).join('');
    const fourthCharByte = twobyte.slice(8, 12).join('');
    const fifthCharByte = twobyte.slice(12, 16).join('');
    const firstCharMapper = {
        '00': 'P',
        '01': 'C',
        '10': 'B',
        '11': 'U'
    };

    const secondCharMapper = {
        '00':  '0',
        '01':  '1',
        '10':  '2',
        '11':  '3'
    };

    const lastCharsMapper = {
        '0000':  '0',
        '0001':  '1',
        '0010':  '2',
        '0011':  '3',
        '0100':  '4',
        '0101':  '5',
        '0110':  '6',
        '0111':  '7',
        '1000':  '8',
        '1001':  '9',
        '1010':  'A',
        '1011':  'B',
        '1100':  'C',
        '1101':  'D',
        '1110':  'E',
        '1111':  'F'
    };
    const firstChar = firstCharMapper[firstCharByte];
    const secondChar = secondCharMapper[secondCharByte];
    const thirdChar = lastCharsMapper[thirdCharByte];
    const fourthChar = lastCharsMapper[fourthCharByte];
    const fifthChar = lastCharsMapper[fifthCharByte];

    if (!firstChar || !secondChar || !thirdChar || !fourthChar || !fifthChar){
      return;
    }

    const Code = firstChar + secondChar + thirdChar + fourthChar + fifthChar;
    const Summary = codes.pcodes[Code];
    if (!Summary){
      return;
    }
    return {Code, Summary};

}

function Hex2Bin(n){if(!checkHex(n))return 0;return parseInt(n,16).toString(2)}
function checkHex(n){return/^[0-9A-Fa-f]{1,64}$/.test(n)}



class Sensor {
  constructor(shortName, name, code, valueFunc, unit){
    this.shortName = shortName;
    this.name = name;
    this.code = code;
    this.valueFunc = valueFunc;
    this.unit = unit;
  }
}

const sensors = {
    'pids': new Sensor("pids", "Supported PIDs", "0100", Hex2Bin, ""),
    'dtc_status': new Sensor("dtc_status", "Status Since DTC Cleared", "0101", "", ""),
    'active_dtcs': new Sensor("active_dtcs", "Active DTCs since DTC Cleared", "03",  "interpretDTCodes", "")
};

export default test = () => {
  return "OBDJS";
}

console.log("Tester: ", statusSinceDTCCleared(hexToByteArray(sample_response)));

// client.setEncoding('utf-8');
// client.on('connect', function(data){
//   const pcode = '02';
//   console.log("Initialization for Pcode: ", pcode);
//   client.write(pcode + '\r\n\0');
// });

// client.on('data', function(data) {
//   console.log('DATA: ' + data);
//   console.log('Hex to String: ' + hexToByteArray(data));
//   // Close the client socket completely
// });

// // Add a 'close' event handler for the client socket
// client.on('close', function() {
//     console.log('Connection closed');
// });