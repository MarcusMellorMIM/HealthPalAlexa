var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "healthpal";
const WEIGHTS_URL = "https://healthpal-api.herokuapp.com/weights";
const HEADERS = { headers: { "Content-Type": "application/json",
                            Accept: "application/json" } };

const fetch = require("node-fetch");

var apiHelper = function () { };

const getJWTHeaders = (userID) => {
// In an ideal world, we will get this from the database with the userId
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.A_-lqUND-Zug8DiDeeFW9B-oalYMJqJpBji0XHkU3dA';
    let headers={}
    Object.assign(headers,HEADERS )
    Object.assign(headers.headers, {Authorization:token })

    return headers
  }

const getConfigObj = ( userID, method, body_detail=null ) => {
// Used for all fetch requests
    let headers = getJWTHeaders(userID);
    Object.assign(headers,  {method:method})
    let configObj={}
    if (body_detail) {
      Object.assign (configObj, headers, {body:JSON.stringify({ detail: body_detail })})
    } else {
      Object.assign (configObj, headers)
    }
    
    return configObj

}

apiHelper.prototype.getWeights = async (userID) => {
// Get all weights ... maybe change route to just send last 2, as this is all I use in Alexa
    let headers = getJWTHeaders(userID);
    console.log(`In gertWeights ${headers}`)
    const response = await fetch(WEIGHTS_URL, headers);

    return await response.json();

}

apiHelper.prototype.addWeight = async (weight, userID) => {
// Add the entered weight
    body = {weight_kg:weight,
            weight_date_d:"",
            weight_date_t:"" };

    let configObj = getConfigObj(userID, "POST", body );
    console.log(`In getWeights ${configObj}`)
    const response = await fetch(WEIGHTS_URL, configObj);

    return await response.json();

}

apiHelper.prototype.removeLastWeight = async (userID) => {
    // Remove the last entered weight, bysetting the index to -1
        let configObj = getConfigObj(userID, "DELETE" );
        console.log(`In removeLastWeight ${configObj}`)
        const response = await fetch(`${WEIGHTS_URL}/last`, configObj);
    
        return await response.json();
    
    }
    
// dbHelper.prototype.removeLastWeight = (userID) => {
//     // I am unsure how to get a proper primary key .... aaarrrrgghghhh
//     // for this reason, I have removed it from the speech stream
//     // QUESTION --- COULD I CHANGE THIS SO AS NOT TO CREATE A NEW PROMISE
//     return new Promise((resolve, reject) => {
//         const params = {
//             TableName: tableName,
//             Key: {
//                 "userId": userID
//             }
//         }
//         docClient.delete(params, function (err, data) {
//             if (err) {
//                 console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
//                 return reject(JSON.stringify(err, null, 2))
//             }
//             console.log(JSON.stringify(err));
//             console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
//             resolve()
//         })
//     });

// }

module.exports = new apiHelper();