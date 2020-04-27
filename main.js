const https = require('https');
const fs = require('fs');
const express = require('express');
const mysql = require("mysql");


/***************** Global variables *********************/
// TLS variable
const options = 
{
  key: fs.readFileSync('certs/private-key.pem'),
  cert: fs.readFileSync('certs/public-cert.pem')
};


// Express variable
const appHTTPS = express();


// Port where the server listens to upcoming requests
const port = 8052;

// mysql uri
const mysqlOptions = 
{
  host:     "127.0.0.1",
  port:     3306,
  user:     "cygnus",
  password: "telematica",
  database: "roomscontrol"
};

// Create database connection
const conn = mysql.createConnection(mysqlOptions);

// Connect to database
conn.connect(function (err)
{
  if (err) throw (err);
  console.log("MySQL Connected");
});


/******************** Functions  ************************/


// Show all measurements
appHTTPS.get('/api/', function(req, res)
{
  let query = "SELECT * FROM house1";
  conn.query(query, function(err, result)
  {
    if (err) throw (err);
    res.send(JSON.stringify({"status": 200, "error": null, "response": result}));
  });
});


// Show single data
appHTTPS.get('/api/:id', function (req, res)
{
  let query = "SELECT * FROM house1 WHERE attrMd=" + req.params.id;
  conn.query(query, function(err, result)
  {
    if (err) throw (err);
    res.send(JSON.stringify({"status": 200, "error": null, "response": result}));
  });
});




// Create the https server
console.log("Listening to secure messages in port: " + port);
https.createServer(options, appHTTPS).listen(port);