var Routest = require('../../../routest')
  , expect  = require('../../../expect')(Routest.runner)
  , test_env
  , db
  ;

test_env = Routest
  .setup('sample-app.json'
  , {
      path: "users"
    , method: "GET"
    }
  )
  .before(function(){
    return test_env.fixtures()
                   .then(function(connection){
                     db = connection
                   });
  })
  

test_env
  .run()
  .test(function(response){
    var body = JSON.parse(response.body);
      ;

    expect('status code', response.statusCode).toBe(200)
      .because('the call should succeed');

    return db.query("SELECT * FROM users")
      .then(function(result){
        expect('the number of users returned', body.length)
          .toBe('the number in the database', result.length);
        expect('the users returned', body)
          .to.be.length('the number in the database', result.length)
          .one().like(body[0])
          .one().like(body[1])
      })
  })

test_env = Routest
  .setup('sample-app.json'
  , {
      path: "users"
    , method: "POST"
    }
  )
  

test_env
  .before(function(){
    test_env.tmp = {}
    return db.query("SELECT count(*) AS count FROM users")
             .then(function(result){
               test_env.tmp.user_count = result[0].count;
             });
  })
  .run({
    body: {
      first: 'new'
    , last: 'user'
    }
  })
  .test(function(response){
    var body = JSON.parse(response.body)
      ;

    expect("the new user's id", body.id).to.exist()
      .because('it should have been set');

    expect("the new user's first name", body.first).toBe('new')
      .because("that is the new user's first name");

    expect("the new user's first name", body.last).toBe('user')
      .because("that is the new user's last name");

    return db.query("SELECT count(*) AS count FROM users")
             .then(function(result){
               expect("the number three", 3)
                .to.be.greaterThan('the concept zero', 0)
                .because('a new user has been added');;
             });

  })
  .after(function(){
    // be nice and clean up the database if you change it
    return test_env.fixtures();
  })


test_env = Routest
  .setup('sample-app.json'
  , {
      path: "users/:id"
    , method: "PUT"
    }
  )
  


test_env
  .before(function(){
    test_env.tmp = {given_user_id: 'user_1'}
    return db.query(
      "SELECT " +
      " id, first, last "+
      " FROM users "+
      "WHERE id='"+test_env.tmp.given_user_id+"'"
    )
     .then(function(result){
       test_env.tmp.result = result[0];
     });
  })
  .run({
    route: {
      id: '@tmp.given_user_id'
    }
  , body: {
      first: 'change'
    , last: 'lastname'
    }
  })
  .test(function(response){
    var body = JSON.parse(response.body)
      ;

    return db.query(
      "SELECT " +
      " id, first, last "+
      " FROM users "+
      "WHERE id='"+test_env.tmp.given_user_id+"'"
    )
     .then(function(result){
      expect("the user's id", body.id).toBe(test_env.tmp.given_user_id)
        .because('it should not change');

      expect("the returned id", body.id)
        .toBe('matched in the database', result[0].id)

       expect("the returned first name", body.first)
        .toBe("matched in the database", result[0].first);

       expect("the returned last name", body.last)
        .toBe("matched in the database",result[0].last);

       expect("the returned last name", body.last)
        .not.toBe("matched in the database", 'stupid');
     });

  })


module.exports = Routest.run()
  .then(function(result){
    db.kill();
    return result.report();
  });
