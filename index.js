const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

//middle wares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("car2go server is running");
});

//mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.00o20sl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyjwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized acces" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.WEB_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "token is wrong" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const servicesCollection = client.db("car2go").collection("services");
    const orderCollection = client.db("car2go").collection("orders");
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/checkout/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    app.get("/orders", verifyjwt, async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const cursor = orderCollection.find(query);
      const orderedProduct = await cursor.toArray();
      res.send(orderedProduct);
    });
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // token

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.WEB_TOKEN, { expiresIn: "1hr" });
      res.send({ token });
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
