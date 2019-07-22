/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
// dbHelper not required for the moment
// const dbHelper = require('./helpers/dbHelper');
const apiHelper = require('./helpers/apiHelper')
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "weight";

const LaunchRequestHandler = {
// The 1st function initiated by Alexa when Eloise is opened
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hello there. I am here to help you reach your weight goals. You can say, add, list or delete weight, food or activity. You can also ask for a summary for today. ';
    const repromptText = 'What would you like to do? You can say HELP to get available options';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

// ////////////////////////////////////
// INPUT HANDLERS
// ////////////////////////////////////
const InProgressAddInputIntentHandler = {
  // This makes sure the inputDetail slot is 
  // filled in, prior to completing the AddInput intent
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddInputIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddInputIntentHandler = {
  // We are at the point where we can add the input into the diary
  // the inputDetail slot has been filled
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddInputIntent'
      && handlerInput.requestEnvelope.request.intent.slots.inputDetail.value; // Will only fire if this is filled
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDetail = slots.inputDetail.value;
    return apiHelper.addInput(inputDetail, userID)
      .then((data) => {
        const speechText = `You have added ${inputDetail} to your diary totalling ${data.calories} calories. You can say add more food, list last food entry or delete last food entry`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving food", err);
        const speechText = "we cannot save your food and dring right now. Please do try again!" + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

// ////////////////////////////////////
// ACTIVITY HANDLERS
// ////////////////////////////////////
const InProgressAddActivityIntentHandler = {
  // This deals with getting the activity text slot
  // when in the AddActivity intent
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddActivityIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}


const AddActivityIntentHandler = {
// We are at the point where we can add the input into the diary
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddActivityIntent'
      && handlerInput.requestEnvelope.request.intent.slots.inputDetail.value; // Will only fire if this is filled
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDetail = slots.inputDetail.value;
    return apiHelper.addActivity(inputDetail, userID)
      .then((data) => {
        const speechText = `You have added ${inputDetail} to your diary totalling ${data.calories} calories.`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving activity", err);
        const speechText = "we cannot save your activity right now. Please do try again!" + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

// ////////////////////////////////////////////////
// INSIGHT SUMMARIES
// ////////////////////////////////////////////////
const InProgressGetSummaryIntentHandler = {
  // This deals with the add intake intent when in mid flow, 
  // and the user hasn't told Alexa what the date is
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'GetSummaryIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const GetSummaryIntentHandler = {
// Give a summary from the inputs, activities and user details
// using the amazon date slot
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetSummaryIntent'
      && handlerInput.requestEnvelope.request.intent.slots.inputDate.value; // Will only fire if this is filled
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDate = slots.inputDate.value;
    console.log(`inputDate value from getInputHandler ${inputDate}`)
    return apiHelper.getSummary(inputDate, userID)
      .then((data) => {
        const speechText = `${data[data.length-1].insight} ${data[data.length-1].speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while getting summary", err);
        const speechText = "we cannot get your summary right now. Please do try again! " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

// ///////////////////////////////
// WEIGHT HANDLERS
// ///////////////////////////////
const InProgressAddWeightIntentHandler = {
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

const AddWeightIntentHandler = {
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

const GetWeightIntentHandler = {
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

const RemoveWeightIntentHandler = {
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

// ///////////////////////////////////////////////////////
// Generic functions
// /////////////////////////////////////////////////////// 
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
    InProgressAddInputIntentHandler,
    AddInputIntentHandler,
    InProgressAddActivityIntentHandler,
    AddActivityIntentHandler,
    InProgressGetSummaryIntentHandler,
    GetSummaryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();
