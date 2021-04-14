const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const app = express();
const port = process.env.port || 5000;

app.use(express.static("doctors"));
app.use(fileUpload());
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbqng.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const appointmentCollection = client
    .db("doctorsPortal")
    .collection("appoinment");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;

    appointmentCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }

      appointmentCollection.find(filter).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });

  app.get("/appointments", (req, res) => {
    appointmentCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addDoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    doctorCollection.insertOne({ name, email, image }).then((result) => {
      console.log(result);
      res.send(result.insertedCount > 0);
    });

    app.get("/doctors", (req, res) => {
      doctorCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;

    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      res.send(doctors.length > 0);
    });
  });
});

app.listen(process.env.PORT || port, () => {
  console.log(`listening at http://localhost:${port}`);
});
