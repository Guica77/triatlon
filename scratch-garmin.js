const { GarminConnect } = require('garmin-connect');

async function main() {
  const GCClient = new GarminConnect();
  try {
    // We would login here, but let's just see if the client initializes
    console.log("Garmin client initialized");
    console.log(Object.keys(GCClient));
    console.log(GCClient.constructor.prototype);
  } catch (e) {
    console.error(e);
  }
}
main();
