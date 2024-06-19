const bitcoin = require("bitcoinjs-lib");
const EC = require("elliptic").ec;
const wif = require("wif");
const crypto = require("crypto");
const fs = require("fs");
const addresses = require("./address");

// Initialize elliptic curve
const ec = new EC("secp256k1");

// Generate a unique random 256-bit number based on time and randomness
function generateUniqueRandom256BitNumber() {
  const timestamp = Date.now().toString();
  const randomValue = Math.floor(
    Math.random() * Number.MAX_SAFE_INTEGER
  ).toString();
  const uniqueString = timestamp + randomValue;

  const hash1 = crypto.createHash("sha256").update(uniqueString).digest("hex");
  const hash2 = crypto.createHash("sha256").update(hash1).digest();

  return hash2;
}

// Check if the generated number is a valid private key (less than n)
function isValidPrivateKey(privateKey) {
  const n = ec.curve.n;
  const privateKeyBigInt = BigInt(`0x${privateKey.toString("hex")}`);
  return privateKeyBigInt < n;
}

// Generate a new 256-bit number using SHA-256 hash
function generateSHA256Hash(input) {
  return crypto.createHash("sha256").update(input).digest();
}

// Convert private key to WIF (Wallet Import Format)
function privateKeyToWIF(privateKey) {
  return wif.encode(128, privateKey, true);
}

// Derive a Bitcoin address from the private key
function getBitcoinAddress(privateKey) {
  const keyPair = ec.keyFromPrivate(privateKey);
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.getPublic("array")),
  });
  return address;
}

// Function to generate and print private key, WIF, and Bitcoin address
function generateAndCheckBitcoinDetails() {
  // Generate the unique random 256-bit number
  let random256BitNumber;
  do {
    random256BitNumber = generateUniqueRandom256BitNumber();
  } while (!isValidPrivateKey(random256BitNumber));

  // Generate the SHA-256 hash
  const privateKey = generateSHA256Hash(random256BitNumber);

  // Convert to WIF
  const wifKey = privateKeyToWIF(privateKey);

  // Generate the corresponding Bitcoin address
  const address = getBitcoinAddress(privateKey);

  // Check if the generated address matches any address in the list
  if (addresses.includes(address)) {
    const match = {
      privateKey: privateKey.toString("hex"),
      wif: wifKey,
      address: address,
    };

    // Append the match details to match.json
    fs.appendFileSync("match.json", JSON.stringify(match, null, 2) + ",\n");
  }

  return { address, matched: addresses.includes(address) };
}

process.on("message", (message) => {
  if (message === "start") {
    let count = 0;
    const interval = setInterval(() => {
      const result = generateAndCheckBitcoinDetails();
      count++;
      process.send(result);
    }, 0);

    setInterval(() => {
      process.send({ count });
      count = 0; // Reset count for the next minute
    }, 60000);
  }
});
