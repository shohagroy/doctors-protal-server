const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.DATABASE_URI;

console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const appointmentCollection = client
      .db("doctors_protal")
      .collection("appointmentOption");

    app.get("/appointments", async (req, res) => {
      const query = {};
      const result = await appointmentCollection.find(query).toArray();

      res.send(result);
    });
  } finally {
  }
};

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Doctors Server is Running");
});

app.listen(port, () => {
  console.log(`Server is Running port: ${port}`);
});
