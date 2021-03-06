var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "healthpal";

var dbHelper = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();

// dbHelper.prototype.addUser = (username, token, userID) => {
//     return new Promise((resolve, reject) => {
//         const params = {
//             TableName: tableName,
//             Item: {
//               'username' : username,
//               'token': token,
//               'userId': userID
//             }
//         };
//         docClient.put(params, (err, data) => {
//             if (err) {
//                 console.log("Unable to insert =>", JSON.stringify(err))
//                 return reject("Unable to insert");
//             }
//             console.log("Saved Data, ", JSON.stringify(data));
//             resolve(data);
//         });
//     });
// }

dbHelper.prototype.getTokens = (userID ) => {

    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            KeyConditionExpression: "#userID = :user_id",
            ExpressionAttributeNames: {
                "#userID": "userId"
            },
            ExpressionAttributeValues: {
                ":user_id": userID
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
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

module.exports = new dbHelper();
