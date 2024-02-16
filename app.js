const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const databasePath = path.join(__dirname, 'covid19IndiaPortal.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertStateObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await database.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}
app.get('/states/', async (request, response) => {
   const selectStatesList = `
  SELECT
   *
  FROM
  state`;
       
  const statesArray = await db.all(selectStatesList)
 response.send(statesArray.map(eachState=>({stateName:eachState.stateName})))
 }) 

app.get("/states/:stateId/", async (request,response)=>{
  const {stateId}=request.params;
  const selectDetails=` 
  SELECT
   state_id
  FROM
  state
  WHERE 
  state_id='${stateId}';`;
       
  const states = await db.get(selectDetails)
  response.send(states)
  }) 


app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases,cured,active,deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district( district_name, state_id, cases, cured, active,deaths)
  VALUES
    (${districtName}, '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId', async (request, response) => {
    const {districtId}=request.params;
   const getDistrictQuery = `
   SELECT 
   *
    FROM 
   district
   WHERE 
   district_id='${districtId}'`;
  const getDetails= await database.get(getDistrictQuery)
  response.send(getDetails)
})





 app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})


app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
   const updateDistrictQuery = `
            UPDATE
              district
            SET
              state_id = ${stateId},
              district_name = '${districtName}',
              
            WHERE
              state_id = ${stateId};`

  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

module.exports = app
console.log(app)
