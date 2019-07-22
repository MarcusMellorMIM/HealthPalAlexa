/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const dbHelper = require('./helpers/dbHelper');
const apiHelper = require('./helpers/apiHelper')
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "weight";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hello there. I am here to help you reach your weight goals. You can say add weight,  get my last weight or delete last weight.';
    const repromptText = 'What would you like to do? You can say HELP to get available options';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const InProgressAddWeightIntentHandler = {
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

// ADD WEIGHT HANDLER
const AddWeightIntentHandler = {
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

// GET WEIGHT HANDLER
const GetWeightIntentHandler = {
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

const InProgressRemoveWeightIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'RemoveWeightIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

// REMOVE WEIGHT HANDLER
const RemoveWeightIntentHandler = {
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
 
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Say add weight, last weight or remove weight';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(GENERAL_REPROMPT)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressAddWeightIntentHandler,
    AddWeightIntentHandler,
    GetWeightIntentHandler,
 //   InProgressRemoveWeightIntentHandler,
    RemoveWeightIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();
