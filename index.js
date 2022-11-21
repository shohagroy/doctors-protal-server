const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.DATABASE_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const secret = process.env.JWT_SECRET;

const jwtVerify = (req, res, next) => {
  const bearerToken = req.headers.authorization;
  const jwtToken = bearerToken.split(" ")[1];

  jwt.verify(jwtToken, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ massege: "unauthorized access" });
    } else {
      req.decoded = decoded;
      next();
    }
  });
};

const run = async () => {
  try {
    const appointmentCollection = client
      .db("doctors_protal")
      .collection("appointmentOption");

    const usersCollection = client.db("doctors_protal").collection("users");
    const bookingCollection = client.db("doctors_protal").collection("booking");

    // create JWT
    app.post("/jwt", (req, res) => {
      const userEmail = req.body;

      const jwtToken = jwt.sign(userEmail, secret, { expiresIn: "5h" });

      res.send({ jwtToken });
    });

    const isAdmin = async (req, res, next) => {
      const adminEmail = req.query.email;
      const filter = { email: adminEmail };

      const user = await usersCollection.find(filter).toArray();

      if (user[0]?.role === "admin") {
        next();
      } else {
        return res.status(403).send({ massege: "unauthorized access" });
      }
    };

    app.get("/appointments", jwtVerify, async (req, res) => {
      const userEmail = req.query.email;
      const decoded = req.decoded.email;

      if (userEmail !== decoded) {
        return res.status(401).send({ massege: "unauthorized access" });
      } else {
        const query = {};
        const result = await appointmentCollection.find(query).toArray();
        res.send(result);
      }
    });

    app.get("/users", jwtVerify, async (req, res) => {
      const userEmail = req.query.email;
      const decoded = req.decoded.email;

      if (userEmail !== decoded) {
        return res.status(401).send({ massege: "unauthorized access" });
      } else {
        const query = {};
        const result = await usersCollection.find(query).toArray();
        res.send(result);
      }
    });

    app.get("/chekAdmin/:email", jwtVerify, async (req, res) => {
      const userEmail = req.params.email;
      const decoded = req.decoded.email;

      if (userEmail !== decoded) {
        return res.status(403).send({ massege: "unauthorized access" });
      } else {
        const query = { email: userEmail };
        const user = await usersCollection.find(query).toArray();

        if (user[0]?.role !== "admin") {
          return res.status(403).send({ massege: "unauthorized access" });
        } else {
          res.send({ isAdmin: user[0]?.role === "admin" });
        }
      }
    });

    app.put("/makeAdmin", jwtVerify, isAdmin, async (req, res) => {
      const userEmail = req.query.email;
      const decoded = req.decoded.email;
      const requestId = req.query.id;
      if (userEmail !== decoded) {
        return res.status(401).send({ massege: "unauthorized access" });
      } else {
        const query = { _id: ObjectId(requestId) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      }
    });

    app.put("/removeAdmin", jwtVerify, isAdmin, async (req, res) => {
      const userEmail = req.query.email;
      const decoded = req.decoded.email;
      const requestId = req.query.id;
      if (userEmail !== decoded) {
        return res.status(401).send({ massege: "unauthorized access" });
      } else {
        const query = { _id: ObjectId(requestId) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            role: "",
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.send(result);
    });
    app.get("/booking", jwtVerify, async (req, res) => {
      const userEmail = req.query.email;
      const decoded = req.decoded.email;

      if (userEmail !== decoded) {
        return res.status(401).send({ massege: "unauthorized access" });
      } else {
        const query = { email: userEmail };
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      }
    });
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);

      if (result.deletedCount === 1) {
        res.send(result);
      }
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
