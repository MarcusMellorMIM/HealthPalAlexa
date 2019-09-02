/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
// dbHelper not required for the moment
const dbHelper = require('./helpers/dbHelper');
const apiHelper = require('./helpers/apiHelper')
// WORKTODO - TRY AND MODULARISE FUNCTIONS -- const weightHelper = require('./helpers/weightHelper')

const GENERAL_REPROMPT = "What would you like to do?  You can say HELP to get available options";
const dynamoDBTableName = "weight";

const LaunchRequestHandler = {
// The 1st function initiated by Alexa when Eloise is opened
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
//  handle(handlerInput) {
    async handle(handlerInput) {

      const {responseBuilder } = handlerInput;
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      const userID = handlerInput.requestEnvelope.context.System.user.userId;  

// Gets the tokens against the amazon account - speech text varies depending on linked accounts
      return (dbHelper.getTokens(userID)
              .then ( (userTokens) => 
                    {
                  // To test .... WORKTODO, actually test in real life just in case returned data for one connection isn't an array
                      if (userTokens.length===0) {
                            // Ok, there are no connected users .... ask the person to create user
                            sessionAttributes.hPalToken = "";
                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                            return { token:"none", speechtext:"Hi, welcome to Eva, there are no health pal linked accounts. You will soon be able to say create account to get started. Please do come back in a week or so. " };
                        } else if (userTokens.length===1) {
                            // Ok, there is one connected user ..... set this token, and away we go
                            sessionAttributes.hPalToken = userTokens[0];
                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                            return { token:userTokens[0].token, speechtext:"Not used" };
                        } else {
                            // Ok there are many users ... ask the user to "select user"
                            sessionAttributes.hPalToken = "";
                            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                            return { token:"none", speechtext:`There are ${userTokens.length} health pal accounts linked to this Alexa, please say get user account to open your user account ` };
                        }
                      // let userToken=userTokens[0];
                      // sessionAttributes.hPalToken = userToken;
                      // handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                      // return userToken.token;
                    })
          .then ( (userToken) => {
            // Do the token selection and getting user information if the token is set
            if (userToken.token!=="none") {
              // There is one account linked to this Alexa
                return apiHelper.getTokenUser(userToken.token)
                      .then((data) => {
                      const speechText = `${data.salutation} ${data.speechtext} `;
                      return responseBuilder
                        .speak(speechText)
                        .reprompt(GENERAL_REPROMPT)
                        .getResponse();
                      })
                      .catch((err) => {
                        console.log("Error occured getting the user ", err);
                        const speechText = ` Sorry but I cannot open the user account right now. Please try again. ` + err
                        return responseBuilder
                          .speak(speechText)
                          .getResponse();
                      }) 
                      } else { 
              // There is either none or too many accounts linked to this Alexa
                        const speechText = userToken.speechtext;
                        return responseBuilder
                          .speak(speechText)
                          .reprompt(GENERAL_REPROMPT)
                          .getResponse();                        
                      }
                }) /* End of userToken then ( and { */
          )
      }
};

// /////////////////////////////////////
// DEMOGRAPHIC HELPERS
// /////////////////////////////////////
const InProgressSwitchUserIntentHandler = {
  // This will set the persons height
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'SwitchUserIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const SwitchUserIntentHandler = {
// Switches to a different account pulling the token
// WORKTODO --- 1) Error handling if user doesnt exist, or if the token has expired
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SwitchUserIntent'
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const userNamePin = slots.userNamePin.value;

    return (dbHelper.getTokens(userID)
          .then ( (userTokens) => 
              { 
                console.log(`About to find token for ${userNamePin}`);
                let userToken=userTokens.filter(tok=>tok.alexapin===parseInt(userNamePin) )[0];
                if (userToken) {
                    sessionAttributes.hPalToken = userToken;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
                    return {token:userToken.token,speechtext:""};
                } else {
                    return {token:"none",speechtext:`Sorry, but I could not find the account numbered ${userNamePin}, please say get user account, and try again.`};
                }
              })
            .then ( (userToken) => {
                if (userToken.token!=="none") {
                          return apiHelper.getTokenUser(userToken.token)
                              .then((data) => {
                                const speechText = `${data.salutation} ${data.speechtext}`;
                                return responseBuilder
                                  .speak(speechText)
                                  .reprompt(GENERAL_REPROMPT)
                                  .getResponse();
                        })
                      .catch((err) => {
                        console.log("Error occured switching user", err);
                        const speechText = ` Sorry but I cannot switch to user account identified by ${userNamePin} right now. Please try again. ` + err
                        return responseBuilder
                          .speak(speechText)
                          .getResponse();
                      })
                } else { // Couldn't find the token, so ask the user to try again
                      const speechText = userToken.speechtext;
                      return responseBuilder
                        .speak(speechText)
                        .getResponse();
                }
        }) // End of userToken if
    )
  }
};



const InProgressAddHeightIntentHandler = {
  // This will set the persons height
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddHeightIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddHeightIntentHandler = {
  // We are at the point where we can add the input into the diary
  // the inputDetail slot has been filled
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddHeightIntent'
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputNumber = slots.inputNumber.value;
    return apiHelper.addHeight(inputNumber, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, you have set your height to ${inputNumber} centimetres. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while setting your height", err);
        const speechText = " Sorry but I cannot set your height right now. Please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const InProgressAddAgeIntentHandler = {
  // This will ask the user for their age
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddAgeIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddAgeIntentHandler = {
  // Add the age once the slot is filled
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddAgeIntent'
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputNumber = slots.inputNumber.value;
    return apiHelper.addAge(inputNumber, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, you have set your age to ${inputNumber} years. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while setting your age", err);
        const speechText = " Sorry but I cannot set your age right now. Please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const InProgressAddGenderIntentHandler = {
  // This will set the persons gender
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddGenderIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddGenderIntentHandler = {
  // Set the gender of a person
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddGenderIntent'
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputGender = slots.inputGender.value;
    return apiHelper.addGender(inputGender, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, you have set your gender to ${data.gender}. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while setting your gender", err);
        const speechText = " Sorry but I cannot set your gender right now. Please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};


// ////////////////////////////////////
// INPUT HANDLERS (MEALS, FOOD AND DRINKS)
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDetail = slots.inputDetail.value;
    return apiHelper.addInput(inputDetail, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, ${data.speechtext}.`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving food", err);
        const speechText = " Sorry but I cannot save your food and dring right now. Please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const GetInputIntentHandler = {
  // Get the last input, meal or drink
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetInputIntent';
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;

// Get the last reading from a fetch request
      return apiHelper.getInput(userToken)
              .then((data) => {
          const speechText = `Your last entry was ${data.detail} , totalling ${data.calories} calories. ${data.speechtext}`;
          return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();

      })
      .catch((err) => {
        const speechText = " Sorry but I cannot get your last meal right now, please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}

const RemoveInputIntentHandler = {
// Remove the last input entry
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RemoveInputIntent';
  }, 
  handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    return apiHelper.removeLastInput(userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, you removed ${data.detail} from your diary, totalling ${data.calories} calories. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = ` Sorry but I cannot remove your last meal just now, please try again. ` + err
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
  }
}

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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDetail = slots.inputDetail.value;
    return apiHelper.addActivity(inputDetail, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats},  ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving activity", err);
        const speechText = " Sorry but I cannot save your activity right now. Please do try again!" + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const GetActivityIntentHandler = {
  // Get the last input, meal or drink
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetActivityIntent';
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;

// Get the last reading from a fetch request
      return apiHelper.getActivity(userToken)
              .then((data) => {
          const speechText = `Your last entry was ${data.detail} , totalling ${data.calories} calories. ${data.speechtext}`;
          return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();

      })
      .catch((err) => {
        const speechText = " Sorry but I cannot get your last activity right now, please try again. " + err
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}

const RemoveActivityIntentHandler = {
// Remove the last input entry
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RemoveActivityIntent';
  }, 
  handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;

    return apiHelper.removeLastActivity(userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}, you removed ${data.detail} from your diary, totalling ${data.calories} calories. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = ` Sorry but I cannot remove your last activity, please try again. ` + err
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
  }
}

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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const inputDate = slots.inputDate.value;
    console.log(`inputDate value from getInputHandler ${inputDate}`)
    return apiHelper.getSummary(inputDate, userToken)
      .then((data) => {
        const speechText = `${data[data.length-1].insight} ${data[data.length-1].speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while getting summary", err);
        const speechText = " Sorry but I cannot get your summary right now. Please try again. " + err
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    let weight = parseInt(slots.weight.value);
    if (slots.decimal_weight.value || slots.decimal_weight.value>0) {
      weight = parseFloat(weight + parseFloat(slots.decimal_weight.value/10))
    }


    return apiHelper.addWeight(weight, userToken)
      .then((data) => {
        const speechText = `${data.speechcongrats}. You have added ${weight} kilos. ${data.speechtext}`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving weight", err);
        const speechText = " Sorry but I cannot save your weight right now. Please try again. " + err
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;
// Get the last reading from a fetch request
      return apiHelper.getWeights(userToken)
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
        const speechText = " Sorry but I cannot get your weight right now. Please try again! " + err
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //  const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const userToken = sessionAttributes.hPalToken.token;

    return apiHelper.removeLastWeight(userToken)
      .then((data) => {
        const speechText = `You have removed your last recorded weight of ${data.weight_kg} kilos. You can add another weight, by saying add weight`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = ` Sorry but I cannot remove your last weight. Please try again. ` + err
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
    const speechText = 'Hello, I am your health pal friend called Eva. You can switch accounts by saying switch user. You can then say, add, get or delete weight, food or activity. You can also ask for a summary for today, or say goodbye if you have finished. ';

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
    const speechText = "It was lovely to speak to you again, please do come back soon. Don't be a stranger. ";

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
      .speak("Sorry, I do not understand the command. Please say again. ")
      .reprompt("Sorry, I do not understand the command. Please say again, or say HELP, to get a list of valid commands or just say goodbye ")
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressSwitchUserIntentHandler,
    SwitchUserIntentHandler,
    InProgressAddAgeIntentHandler,
    AddAgeIntentHandler,
    InProgressAddGenderIntentHandler,
    AddGenderIntentHandler,
    InProgressAddHeightIntentHandler,
    AddHeightIntentHandler,
    InProgressAddWeightIntentHandler,
    AddWeightIntentHandler,
    GetWeightIntentHandler,
    RemoveWeightIntentHandler,
    InProgressAddInputIntentHandler,
    AddInputIntentHandler,
    GetInputIntentHandler,
    RemoveInputIntentHandler,
    InProgressAddActivityIntentHandler,
    AddActivityIntentHandler,
    GetActivityIntentHandler,
    RemoveActivityIntentHandler,
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