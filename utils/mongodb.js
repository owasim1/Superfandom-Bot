const { MongoClient } = require("mongodb");
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI ?? ""
const MONGODB_DB = process.env.MONGODB_DB ?? "";

const opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  waitQueueTimeoutMS: 60 * 1000,
};

let client;
let clientPromise;

let clientToReturn;
let db;

async function connectToDatabase() {
  try {
    if (!client) {
      console.log("Initializing Mongo Connection ");
      client = new MongoClient(MONGODB_URI, opts);
      clientPromise = client.connect();
      clientToReturn = await clientPromise;
      db = await clientToReturn.db(MONGODB_DB);
    } else {
      console.log("Db already initialized");
      clientToReturn = await clientPromise;
      db = await clientToReturn.db(MONGODB_DB);
    }
  } catch (e) {
    console.error("MONGO ERROR", e);
  }
  return { client: clientToReturn, db };
}

module.exports = {
  connectToDatabase,
};
