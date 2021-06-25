require('dotenv').config();
import request from 'request';
import requestPromise from 'request-promise';
import chatBotService from '../services';

const BACK_END_URL = process.env.BACK_END_URL;
const FRONT_END_URL = process.env.FRONT_END_URL;

let user = {
  name: '',
  phoneNumber: '',
  time: '',
  quantity: '',
  createdAt: '',
};

let postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

let getWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

// Handles messages events
let handleMessage = async (sender_psid, message) => {
  //checking quick reply
  if (message && message.quick_reply && message.quick_reply.payload) {
    if (message.quick_reply.payload.includes('SUB_CATEGORY_ID')) {
      const subCategoryID = message.quick_reply.payload.substring(16);

      await chatBotService.markMessageSeen(sender_psid);
      await chatBotService.sendTypingOn(sender_psid);
      await chatBotService.sendCourses(sender_psid, 4, { subCategoryID });
      return;
    }

    if (message.quick_reply.payload.includes('CATEGORY_ID')) {
      const categoryID = message.quick_reply.payload.substring(12);

      await chatBotService.markMessageSeen(sender_psid);
      await chatBotService.sendTypingOn(sender_psid);
      await chatBotService.sendSubCategories(sender_psid, categoryID);
      return;
    }

    if (message.quick_reply.payload !== ' ') {
      const name = message.quick_reply.payload;

      console.log({ name });

      await chatBotService.markMessageSeen(sender_psid);
      await chatBotService.sendTypingOn(sender_psid);
      await chatBotService.sendCourses(sender_psid, 4, { name });
    }
    return;
  }

  //handle text message
  let entity = handleMessageWithEntities(message);

  await chatBotService.sendTypingOn(sender_psid);
  await chatBotService.markMessageSeen(sender_psid);

  if (entity.name === 'wit$datetime:datetime') {
    //handle quick reply message: asking about the party size , how many people
    user.time = moment(entity.value).zone('+07:00').format('MM/DD/YYYY h:mm A');

    await chatBotService.sendMessageAskingQuality(sender_psid);
  } else if (entity.name === 'wit$phone_number:phone_number') {
    //handle quick reply message: done reserve table

    user.phoneNumber = entity.value;
    user.createdAt = moment(Date.now())
      .zone('+07:00')
      .format('MM/DD/YYYY h:mm A');

    // send messages to the user
    await chatBotService.sendMessageDoneReserveTable(sender_psid);
  } else if (entity.name === 'wit$greetings') {
  } else if (entity.name === 'wit$thanks') {
  } else if (entity.name === 'wit$bye') {
  } else {
    //default reply
    await chatBotService.sendMessageDefaultForTheBot(sender_psid);
  }

  //handle attachment message
};

let handleMessageWithEntities = (message) => {
  let entitiesArr = [
    'wit$datetime:datetime',
    'wit$phone_number:phone_number',
    'wit$greetings',
    'wit$thanks',
    'wit$bye',
  ];
  let entityChosen = '';
  let data = {}; // data is an object saving value and name of the entity.
  entitiesArr.forEach((name) => {
    let entity = firstTrait(message.nlp, name.trim());
    if (entity && entity.confidence > 0.8) {
      entityChosen = name;
      data.value = entity.value;
    }
  });

  data.name = entityChosen;

  // checking language
  if (message && message.nlp && message.nlp.detected_locales) {
    if (message.nlp.detected_locales[0]) {
      let locale = message.nlp.detected_locales[0].locale;
      data.locale = locale.substring(0, 2);
    }
  }
  return data;
};

// function firstEntity(nlp, name) {
//     return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
// }

function firstTrait(nlp, name) {
  return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
}

// Handles messaging_postbacks events
let handlePostback = async (sender_psid, received_postback) => {
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;
  // Set the response based on the postback payload

  await chatBotService.markMessageSeen(sender_psid);

  if (payload.includes('SHOW_DETAIL')) {
    const courseID = payload.substring(12);
    await chatBotService.sendDetailCourse(sender_psid, courseID);
    return;
  }

  switch (payload) {
    case 'GET_STARTED':
    case 'RESTART_CONVERSATION':
      //get facebook username
      let username = await chatBotService.getFacebookUsername(sender_psid);
      user.name = username;
      //send welcome response to users

      await chatBotService.sendResponseWelcomeNewCustomer(
        username,
        sender_psid
      );
      break;
    case 'SHOW_CATEGORY':
      await chatBotService.sendCategories(sender_psid);
      break;
    case 'SHOW_COURSE':
      await chatBotService.sendCourseMenu(sender_psid);
      break;
    case 'MAIN_MENU':
      await chatBotService.sendMainMenu(sender_psid);
      break;
    case 'SHOW_FINISH':
      await chatBotService.sendMessageDoneReserveTable(sender_psid);
      break;
    case 'BACK_TO_MAIN_MENU':
      await chatBotService.goBackToMainMenu(sender_psid);
      break;
    case 'SEARCH_COURSES':
      await chatBotService.getTypingNameCourses(sender_psid);
      break;
    case 'MOST_VIEW_COURSES':
      await chatBotService.sendCourses(sender_psid, 1, {});
      break;
    case 'HIGHLIGHT_COURSES':
      await chatBotService.sendCourses(sender_psid, 3, {});
      break;

    case 'yes':
      response = { text: 'Thank you!' };
      callSendAPI(sender_psid, response);
      break;
    case 'no':
      response = { text: 'Please try another image.' };
      callSendAPI(sender_psid, response);
      break;
    default:
      console.log('Something wrong with switch case payload');
  }
  // Send the message to acknowledge the postback
  // callSendAPI(sender_psid, response);
};

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: 'https://graph.facebook.com/v6.0/me/messages',
      qs: { access_token: process.env.FB_PAGE_TOKEN },
      method: 'POST',
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log('message sent!');
      } else {
        console.error('Unable to send message:' + err);
      }
    }
  );
}

module.exports = {
  postWebhook: postWebhook,
  getWebhook: getWebhook,
};
