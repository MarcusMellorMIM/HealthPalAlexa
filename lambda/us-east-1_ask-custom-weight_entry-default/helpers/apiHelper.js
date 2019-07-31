var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "healthpal";
const BASE_URL = "https://healthpal-api.herokuapp.com"
const USERS_URL = `${BASE_URL}/users/show`;
const WEIGHTS_URL = `${BASE_URL}/weights`;
const INPUTS_URL = `${BASE_URL}/inputs`;
const ACTIVITIES_URL = `${BASE_URL}/activities`;

const HEADERS = { headers: { "Content-Type": "application/json",
                            Accept: "application/json" } };

const fetch = require("node-fetch");
const AmazonDateParser = require('amazon-date-parser');

const apiHelper = function () { };

const getJWTHeaders = (userID) => {
// In an ideal world, we will get this from the database with the userId
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.A_-lqUND-Zug8DiDeeFW9B-oalYMJqJpBji0XHkU3dA';
    let headers={}
    Object.assign(headers,HEADERS )
    Object.assign(headers.headers, {Authorization:token })

    return headers
  }

const getJWTTokenHeaders = (userToken) => {
    // In an ideal world, we will get this from the database with the userId
        let headers={}
        Object.assign(headers,HEADERS )
        Object.assign(headers.headers, {Authorization:userToken })
    
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

const getConfigTokenObj = ( userToken, method, body_detail=null ) => {
    // Used for all fetch requests
        let headers = getJWTTokenHeaders(userToken);
        Object.assign(headers,  {method:method})
        let configObj={}
        if (body_detail) {
          Object.assign (configObj, headers, {body:JSON.stringify({ detail: body_detail })})
        } else {
          Object.assign (configObj, headers)
        }
        
        return configObj
    
    }
    
// apiHelper.prototype.getUser = async (userID) => {
//     // Get user information for the welcome message
//         let headers = getJWTHeaders(userID);
//         console.log(`In getUsers ${headers}`)
//         const response = await fetch(USERS_URL, headers);
    
//         return await response.json();
    
//     }

apiHelper.prototype.getTokenUser = async (userToken) => {
        // Get user information for the welcome message
            let headers = getJWTTokenHeaders(userToken);
            console.log(`In token getUsers ${headers}`)
            const response = await fetch(USERS_URL, headers);
        
            return await response.json();
        
        }
    

// apiHelper.prototype.addHeight = async (inputNumber, userID) => {
//         // Update the user with the height
//             body = {height_cm:inputNumber};        
//             let configObj = getConfigObj(userID, "PATCH", body );
//             console.log(`In setHeight ${configObj}`)
//             const response = await fetch(USERS_URL, configObj);
        
//             return await response.json();
        
//         }

apiHelper.prototype.addHeight = async (inputNumber, userToken) => {
            // Update the user with the height
                body = {height_cm:inputNumber};        
                let configObj = getConfigTokenObj(userToken, "PATCH", body );
                console.log(`In setHeight ${configObj}`)
                const response = await fetch(USERS_URL, configObj);
            
                return await response.json();
            
            }
    
// apiHelper.prototype.addAge = async (inputNumber, userID) => {
//             // Update the user's dob using the age in years, the rails router controller will sort out the date
//                 body = {age_years:inputNumber};        
//                 let configObj = getConfigObj(userID, "PATCH", body );
//                 console.log(`In setHeight ${configObj}`)
//                 const response = await fetch(USERS_URL, configObj);

//                 return await response.json();
//             }

apiHelper.prototype.addAge = async (inputNumber, userToken) => {
    // Update the user's dob using the age in years, the rails router controller will sort out the date
        body = {age_years:inputNumber};        
        let configObj = getConfigTokenObj(userToken, "PATCH", body );
        console.log(`In setHeight ${configObj}`)
        const response = await fetch(USERS_URL, configObj);

        return await response.json();
    }
    
// apiHelper.prototype.addGender = async (inputGender, userID) => {
// // Update the user with the transformed gender
//     switch (inputGender.toLowerCase()) {
//         case "male":
//             inputGender = "Male";
//             break;
//         case "female":
//             inputGender = "Female";
//             break;
//         case "man":
//             inputGender = "Male";
//             break;
//         case "boy":
//             inputGender = "Male";
//             break;
//         case "girl":
//             inputGender = "Female";
//             break;
//         case "lady":
//             inputGender = "Female";
//             break;
//         case "woman":
//             inputGender = "Female";
//             break;
//         default:
//             inputGender = "Female";
//         }

//         body = {gender:inputGender};        
//         let configObj = getConfigObj(userID, "PATCH", body );
//         console.log(`In setHeight ${configObj}`)
//         const response = await fetch(USERS_URL, configObj);
    
//         return await response.json();
// }

apiHelper.prototype.addGender = async (inputGender, userToken) => {
    // Update the user with the transformed gender
        switch (inputGender.toLowerCase()) {
            case "male":
                inputGender = "Male";
                break;
            case "female":
                inputGender = "Female";
                break;
            case "man":
                inputGender = "Male";
                break;
            case "boy":
                inputGender = "Male";
                break;
            case "girl":
                inputGender = "Female";
                break;
            case "lady":
                inputGender = "Female";
                break;
            case "woman":
                inputGender = "Female";
                break;
            default:
                inputGender = "Female";
            }
    
            body = {gender:inputGender};        
            let configObj = getConfigTokenObj(userToken, "PATCH", body );
            console.log(`In setHeight ${configObj}`)
            const response = await fetch(USERS_URL, configObj);
        
            return await response.json();
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
// Remove the last entered weight, bysetting the index to last
        let configObj = getConfigObj(userID, "DELETE" );
        console.log(`In removeLastWeight ${configObj}`)
        const response = await fetch(`${WEIGHTS_URL}/last`, configObj);
    
        return await response.json();
    
    }
    
apiHelper.prototype.addInput = async (inputDetail, userToken) => {
// Add the entered input, food or drinks
            body = {detail:inputDetail,
                    alexa:"yes" };
        
            let configObj = getConfigTokenObj(userToken, "POST", body );
            console.log(`In addInputs ${configObj}`)
            const response = await fetch(INPUTS_URL, configObj);
        
            return await response.json();
        
        }

apiHelper.prototype.removeLastInput = async (userToken) => {
    // Remove the last entered weight, bysetting the index to -1
            let configObj = getConfigTokenObj(userToken, "DELETE" );
            console.log(`In removeLastInput ${configObj}`)
            const response = await fetch(`${INPUTS_URL}/last`, configObj);
        
            return await response.json();
        
        }

apiHelper.prototype.getInput = async (userToken) => {
    // Get the last input recorded
        let headers = getJWTTokenHeaders(userToken);
        console.log(`In getInputs ${headers}`)
        const response = await fetch(`${INPUTS_URL}/last`, headers);
    
        return await response.json();
    }
            
apiHelper.prototype.addActivity = async (inputDetail, userID) => {
// Add activities
            body = {detail:inputDetail,
                    alexa:"yes" };
        
            let configObj = getConfigObj(userID, "POST", body );
            console.log(`In addActivities ${configObj}`)
            const response = await fetch(ACTIVITIES_URL, configObj);
        
            return await response.json();
        
        }

apiHelper.prototype.removeLastActivity = async (userID) => {
    // Remove the last entered activity, bysetting the index to last
            let configObj = getConfigObj(userID, "DELETE" );
            console.log(`In removeLastActivity ${configObj}`)
            const response = await fetch(`${ACTIVITIES_URL}/last`, configObj);
        
            return await response.json();
        
        }

apiHelper.prototype.getActivity = async (userID) => {
    // Get the last activity recorded
        let headers = getJWTHeaders(userID);
        console.log(`In getInputs ${headers}`)
        const response = await fetch(`${ACTIVITIES_URL}/last`, headers);
    
        return await response.json();
    }

apiHelper.prototype.getSummary = async (inputDate, userID) => {
// Get a summary for a given date range
// The dates are a hash of startDate and endDate
            const summaryDate = new AmazonDateParser(inputDate);
            // The date should be in the following format
            //            { endDate: Sun Dec 03 2017 23:59:59 GMT+0000 (GMT),
            //             startDate: Mon Nov 27 2017 00:00:00 GMT+0000 (GMT) }
            let headers = getJWTHeaders(userID);
            Object.assign(headers.headers, summaryDate)
            console.log(`In getInputs ${headers}`)
            const response = await fetch(`${BASE_URL}/usersummary`, headers);
        
            return await response.json();
        
        }
        
module.exports = new apiHelper();