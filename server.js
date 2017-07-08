var express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser'),
  app = express(),
  expressValidator = require('express-validator');


/*Set EJS template Engine*/
app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); //support x-www-form-urlencoded
app.use(bodyParser.json());
app.use(expressValidator());

/*MySql connection*/
var connection = require('express-myconnection'),
  mysql = require('mysql');

app.use(
  connection(mysql, {
    host: 'localhost',
    user: 'root',
    password: 'warren123',
    database: 'warren_sunrise',
    debug: false //set true if you wanna see debug logger
  }, 'request')
);

app.get('/', function (req, res) {
  res.send('Welcome');
});


//RESTful route
var router = express.Router();


/*------------------------------------------------------
 *  This is router middleware,invoked everytime
 *  we hit url /api and anything after /api
 *  like /api/user , /api/user/7
 *  we can use this for doing validation,authetication
 *  for every route started with /api
 --------------------------------------------------------*/
router.use(function (req, res, next) {
  console.log(req.method, req.url);
  next();
});

var curut = router.route('/players');
const tblPlayer = 'tbl_player';

//show the CRUD interface | GET
curut.get(function (req, res, next) {
  req.getConnection(function (err, conn) {
    if (err) return next("Cannot Connect");
    var query = conn.query('SELECT * FROM ' + tblPlayer, function (err, rows) {
      if (err) {
        console.log(err);
        return next("Mysql error, check your query");
      }
      res.json(rows);
    });
  });
});
//post data to DB | POST
curut.post(function (req, res, next) {

  //validation
  req.assert('name', 'Name is required').notEmpty();
  req.assert('nickname', 'Nick Name is required').notEmpty();
  req.assert('position', 'Position is required').notEmpty();
  req.assert('score', 'Score is required').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    res.status(422).json(errors);
    return;
  }

  //get data
  var data = {
    name: req.body.name,
    nickname: req.body.nickname,
    position: req.body.position,
    score: req.body.score,
  };

  //inserting into mysql
  req.getConnection(function (err, conn) {
    if (err) return next("Cannot Connect");
    var query = conn.query("INSERT INTO tbl_player set ? ", data, function (err, rows) {
      if (err) {
        console.log(err);
        return next("Mysql error, check your query");
      }
      res.sendStatus(200);
    });
  });
});


//now for Single route (GET,DELETE,PUT)
var curut2 = router.route('/player/:playerId');

/*------------------------------------------------------
 route.all is extremely useful. you can use it to do
 stuffs for specific routes. for example you need to do
 a validation everytime route /api/user/:user_id it hit.

 remove curut2.all() if you dont want it
 ------------------------------------------------------*/
curut2.all(function (req, res, next) {
  // console.log("You need to smth about curut2 Route ? Do it here");
  console.log(req.params);
  next();
});

//get data to update
curut2.get(function (req, res, next) {
  var playerId = req.params.playerId;

  req.getConnection(function (err, conn) {
    if (err) return next("Cannot Connect");
    var query = conn.query('SELECT * FROM ' + tblPlayer + ' WHERE id = ? ', [playerId], function (err, rows) {
      if (err) {
        console.log(err);
        return next("Mysql error, check your query");
      }
      //if user not found
      if (rows.length < 1)
        return res.send("Player Not found");
      res.json(rows[0]);
    });

  });

});

//update data
curut2.put(function (req, res, next) {
  var playerId = req.params.playerId;

  //validation
  req.assert('name', 'Name is required').notEmpty();
  req.assert('nickname', 'Nick Name is required').notEmpty();
  req.assert('position', 'Position is required').notEmpty();
  req.assert('score', 'Score is required').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    res.status(422).json(errors);
    return;
  }

  //get data
  var data = {
    name: req.body.name,
    nickname: req.body.nickname,
    position: req.body.position,
    score: req.body.score,
  };

  //inserting into mysql
  req.getConnection(function (err, conn) {
    if (err) return next("Cannot Connect");
    var query = conn.query("UPDATE " + tblPlayer + " SET ? WHERE id = ? ", [data, playerId], function (err, rows) {
      if (err) {
        console.log(err);
        return next("Mysql error, check your query");
      }
      res.sendStatus(200);
    });
  });
});

//delete data
curut2.delete(function (req, res, next) {
  var playerId = req.params.playerId;
  req.getConnection(function (err, conn) {
    if (err) return next("Cannot Connect");
    var query = conn.query("DELETE FROM " + tblPlayer + " WHERE id = ? ", [playerId], function (err, rows) {
      if (err) {
        console.log(err);
        return next("Mysql error, check your query");
      }
      res.sendStatus(200);
    });
  });
});

//now we need to apply our router here
app.use('/api', router);

//start Server
var server = app.listen(3000, function () {

  console.log("Listening to port %s", server.address().port);

});
