const apiHelper = require('./helpers/apiHelper')
const weightHelper = function () { };

// ///////////////////////////////
// WEIGHT HANDLERS
// ///////////////////////////////
weightHelper.prototype.InProgressAddWeightIntentHandler = {
    // Get the weight_kg slot, if not already filled
      canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
          request.intent.name === 'AddWeightIntent' &&
          request.dialogState !== 'COMPLETED';
      },
      handle(handlerInput) {
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        return handlerInput.responseBuilder
          .addDelegateDirective(currentIntent)
          .getResponse();
      }
    }
    
weightHelper.prototype.AddWeightIntentHandler = {
    // Add the weight, once the weight_kg slot has been filled
      canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'AddWeightIntent';
      },
      async handle(handlerInput) {
        const {responseBuilder } = handlerInput;
        const userID = handlerInput.requestEnvelope.context.System.user.userId; 
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const weight = parseInt(slots.weight.value);
        return apiHelper.addWeight(weight, userID)
          .then((data) => {
            const speechText = `You have added ${weight} kilos. You can say add to add another reading or list to listen to the last reading`;
            return responseBuilder
              .speak(speechText)
              .reprompt(GENERAL_REPROMPT)
              .getResponse();
          })
          .catch((err) => {
            console.log("Error occured while saving weight", err);
            const speechText = "we cannot save your weight right now. Try again!" + err
            return responseBuilder
              .speak(speechText)
              .getResponse();
          })
      },
    };
    
weightHelper.prototype.GetWeightIntentHandler = {
      // Get the last weight, and compare against the one before
      canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'GetWeightIntent';
      },
      async handle(handlerInput) {
        const {responseBuilder } = handlerInput;
        const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    // Get the last reading from a fetch request
          return apiHelper.getWeights(userID)
                  .then((data) => {
            var speechText = "Your last weight was "
            if (data.length == 0) {
              speechText = "You have not recorded your weight yet, add your weight by saying add weight "
            } else if (data.length > 0){
              speechText += data[data.length-1].weight_kg + " kilos. Prior to that your weight was " + data[data.length-2].weight_kg
            } else {
                speechText += data[0].weight_kg + " kilos"
            }
    
            return responseBuilder
              .speak(speechText)
              .reprompt(GENERAL_REPROMPT)
              .getResponse();
    
          })
          .catch((err) => {
            const speechText = "we cannot get your weight right now. Try again! " + err
            return responseBuilder
              .speak(speechText)
              .getResponse();
          })
      }
    }
    
weightHelper.prototype.RemoveWeightIntentHandler = {
    // Remove the last weight entry
      canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'RemoveWeightIntent';
      }, 
      handle(handlerInput) {
        const {responseBuilder } = handlerInput;
        const userID = handlerInput.requestEnvelope.context.System.user.userId; 
        return apiHelper.removeLastWeight(userID)
          .then((data) => {
            const speechText = `You have removed your last recorded weight of ${data.weight_kg} kilos. You can add another weight, by saying add weight`
            return responseBuilder
              .speak(speechText)
              .reprompt(GENERAL_REPROMPT)
              .getResponse();
          })
          .catch((err) => {
            const speechText = `There was an error removing your last weight ` + err
            return responseBuilder
              .speak(speechText)
              .reprompt(GENERAL_REPROMPT)
              .getResponse();
          })
      }
    }

module.exports = new weightHelper();    