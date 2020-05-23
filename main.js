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

// mysql connection options
const mysqlOptions = 
{
  host:     "127.0.0.1",
  port:     3306,
  user:     "cygnus",
  password: "telematica"
};

// Create database connection
const conn = mysql.createConnection(mysqlOptions);

// Connect to database
conn.connect(function (err)
{
  if (err) throw (err);
  console.log("MySQL Connected");
});

// Basic authentication 
const auth = {login: 'cygnus', password: 'telematica'};

/******************** Functions  ************************/
/**
 * Authenticates the user
 * @param {https.request} req 
 * @param {https.request} res 
 * @param {https.next()} next 
 */
const loginMiddleware = function (req, res, next) 
{

  // check for basic auth header
  if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) 
  {
    return res.status(401).json({ message: 'Missing Authorization Header' });
  }

  // Parse login and password
  let b64Auth = (req.headers.authorization || '').split(' ')[1];
  let login = Buffer.from(b64Auth, 'base64').toString();
 
  // Verify auth credentials
  if (login === auth.login + ":" + auth.password) {
    // Access granted
    return next()
  }

  // Deny access
  return res.status(401).json({ message: 'Authentication failed: wrong user or/and password' });
};

// Use the login middleware in all the paths to authenticate users
appHTTPS.use(loginMiddleware);


// Show all measurements
appHTTPS.get('/:database/:table', function(req, res)
{
  let query = "SELECT * FROM " + (req.params.database).toLowerCase() + "." + (req.params.table).toLowerCase();
  conn.query(query, function(err, result)
  {
    if (err) res.status(404).json({message: "Resource not found"});
    res.status(200).json(result);
    res.end();
  });
});


// Show single measurement
appHTTPS.get('/:database/:table/:id', function (req, res)
{

  // Extract the parameters from the URL
  let database = req.params.database;
  let table = req.params.table;

  // Query the database
  let _query = '[{"name":"hash","type":"String","value":"' + req.params.id.toLowerCase() + '"}]';  
  let query = "SELECT * FROM " + database.toLowerCase() + "." + table.toLowerCase() + " WHERE attrMd='" +_query + "'";
  
  conn.query(query, function(err, result)
  {
    if (err) res.status(404).json({message: "Resource not found"});
    res.status(200).json(result[0]);
    res.end();
  });
});


// Delete a measurement
appHTTPS.get('/delete/:database/:table/:id', function (req, res)
{

  // Extract the parameters from the URL
  let database = req.params.database;
  let table = req.params.table;

  // Query the database
  let _query = '[{"name":"hash","type":"String","value":"' + req.params.id.toLowerCase() + '"}]';  
  let query = "DELETE * FROM " + database.toLowerCase() + "." + table.toLowerCase() + " WHERE attrMd='" +_query + "'";
  
  conn.query(query, function(err, result)
  {
    if (err) res.status(404).json({message: "Resource not found"});
    res.status(200).json(result);
    res.end();
  });
});



// Create the https server
console.log("Listening to secure messages in port: " + port);
https.createServer(options, appHTTPS).listen(port);