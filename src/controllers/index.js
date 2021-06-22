require("dotenv").config();
import request from "request";

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: { text: response },
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v7.0/me/messages",
      qs: { access_token: process.env.FB_PAGE_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    response = { text: "Thanks!" };
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// function firstTrait(nlp, name) {
//     return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
// }

function firstTrait(nlp, name) {
  return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
}

function handleMessage(sender_psid, message) {
  //handle message for react, like press like button
  // id like button: sticker_id 369239263222822

  if (message && message.attachments && message.attachments[0].payload) {
    callSendAPI(sender_psid, "Thank you for watching my video !!!");
    callSendAPIWithTemplate(sender_psid);
    return;
  }

  let entitiesArr = ["wit$greetings", "wit$thanks", "wit$bye"];
  let entityChosen = "";
  entitiesArr.forEach((name) => {
    let entity = firstTrait(message.nlp, name);
    if (entity && entity.confidence > 0.8) {
      entityChosen = name;
    }
  });

  if (entityChosen === "") {
    //default
    callSendAPI(
      sender_psid,
      `The bot is needed more training, try to say "thanks a lot" or "hi" to the bot`
    );
  } else {
    if (entityChosen === "wit$greetings") {
      //send greetings message
      callSendAPI(
        sender_psid,
        "Hi there! This bot is created by Hary Pham. Watch more videos on HaryPhamDev Channel!"
      );
    }
    if (entityChosen === "wit$thanks") {
      //send thanks message
      callSendAPI(sender_psid, `You 're welcome!`);
    }
    if (entityChosen === "wit$bye") {
      //send bye message
      callSendAPI(sender_psid, "bye-bye!");
    }
  }
}

const callSendAPIWithTemplate = (sender_psid) => {
  // document fb message template
  const courses = await request.get({
    url: `${process.env.BACK_END_URL}/courses?type=1&limit=10&page=1`,
  });

  const coursesObj = JSON.parse(courses);

  const coursesTemplate = coursesObj.map((e) => {
    const item = {
      title: e.name,
      image_url: e.urlThumb,
      subtitle: e.introDescription,
      buttons: [
        {
          type: "web_url",
          url: `${process.env.FRONT_END_URL}detail-course/${e._id}`,
          title: "Watch now",
        },
      ],
    };

    return item;
  });

  const body = {
    recipient: {
      id: sender_psid,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: coursesTemplate,
        },
      },
    },
  };

  request(
    {
      uri: "https://graph.facebook.com/v6.0/me/messages",
      qs: { access_token: process.env.FB_PAGE_TOKEN },
      method: "POST",
      json: body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
};

const postWebhook = (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

const getWebhook = (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;

  // Parse the query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

// Handles messages events
// function handleMessage(sender_psid, received_message) {
//     let response;
//
//     // Check if the message contains text
//     if (received_message.text) {
//
//         // Create the payload for a basic text message
//         response = {
//             "text": `You sent the message: "${received_message.text}". Now send me an image!`
//         }
//     } else if (received_message.attachments) {
//
//     // Gets the URL of the message attachment
//     let attachment_url = received_message.attachments[0].payload.url;
//         response = {
//             "attachment": {
//                 "type": "template",
//                 "payload": {
//                     "template_type": "generic",
//                     "elements": [{
//                         "title": "Is this the right picture?",
//                         "subtitle": "Tap a button to answer.",
//                         "image_url": attachment_url,
//                         "buttons": [
//                             {
//                                 "type": "postback",
//                                 "title": "Yes!",
//                                 "payload": "yes",
//                             },
//                             {
//                                 "type": "postback",
//                                 "title": "No!",
//                                 "payload": "no",
//                             }
//                         ],
//                     }]
//                 }
//             }
//         }
//
// }
//
// // Sends the response message
//     callSendAPI(sender_psid, response);
// }

module.exports = {
  postWebhook: postWebhook,
  getWebhook: getWebhook,
};

// const httpStatus = require('http-status');
// const request = require('request');
// const ApiError = require('../utils/ApiError');
// const catchAsync = require('../utils/catchAsync');
// const config = require('../config/config');
// const logger = require('../config/logger');

// // Sends response messages via the Send API
// function callSendAPI(senderPSID, response) {
//   // Construct the message body
//   const requestBody = {
//     recipient: {
//       id: senderPSID,
//     },
//     message: { text: response },
//   };

//   console.log({ response });

//   // Send the HTTP request to the Messenger Platform
//   request(
//     {
//       url: 'https://graph.facebook.com/v11.0/me/messages',
//       qs: { access_token: config.chatbot.facebookToken },
//       method: 'POST',
//       json: requestBody,
//     },
//     (err) => {
//       if (!err) {
//         logger.info('message sent!');
//       } else {
//         logger.error(`Unable to send message:${err}`);
//       }
//     }
//   );
// }

// function handlePostback(senderPSID, receivedPostback) {
//   let response;

//   // Get the payload for the postback
//   const { payload } = receivedPostback;

//   // Set the response based on the postback payload
//   if (payload === 'yes') {
//     response = { text: 'Thanks!' };
//   } else if (payload === 'no') {
//     response = { text: 'Oops, try sending another image.' };
//   }
//   // Send the message to acknowledge the postback
//   callSendAPI(senderPSID, response);
// }

// function firstTrait(nlp, name) {
//   return nlp && nlp.entities && nlp.traits[name] && nlp.traits[name][0];
// }

// const callSendAPIWithTemplate = (senderPSID) => {
//   // document fb message template
//   // https://developers.facebook.com/docs/messenger-platform/send-messages/templates
//   const body = {
//     recipient: {
//       id: senderPSID,
//     },
//     message: {
//       attachment: {
//         type: 'template',
//         payload: {
//           template_type: 'generic',
//           elements: [
//             {
//               title: 'Want to build sth awesome?',
//               image_url: 'https://www.nexmo.com/wp-content/uploads/2018/10/build-bot-messages-api-768x384.png',
//               subtitle: 'Watch more videos on my youtube channel ^^',
//               buttons: [
//                 {
//                   type: 'web_url',
//                   url: 'https://bit.ly/subscribe-haryphamdev',
//                   title: 'Watch now',
//                 },
//               ],
//             },
//           ],
//         },
//       },
//     },
//   };

//   request(
//     {
//       uri: 'https://graph.facebook.com/v6.0/me/messages',
//       qs: { access_token: config.chatbot.facebookToken },
//       method: 'POST',
//       json: body,
//     },
//     (err) => {
//       if (!err) {
//         logger.info('message sent!');
//       } else {
//         logger.error(`Unable to send message:${err}`);
//       }
//     }
//   );
// };

// function handleMessage(senderPSID, message) {
//   // handle message for react, like press like button
//   // id like button: sticker_id 369239263222822

//   if (message && message.attachments && message.attachments[0].payload) {
//     callSendAPI(senderPSID, 'Thank you for watching my video !!!');
//     callSendAPIWithTemplate(senderPSID);
//     return;
//   }

//   const entitiesArr = ['wit$greetings', 'wit$thanks', 'wit$bye'];
//   let entityChosen = '';
//   entitiesArr.forEach((name) => {
//     const entity = firstTrait(message.nlp, name);
//     if (entity && entity.confidence > 0.8) {
//       entityChosen = name;
//     }
//   });

//   console.log({ entityChosen });

//   if (entityChosen === '') {
//     // default
//     callSendAPI(senderPSID, `The bot is needed more training, try to say "thanks a lot" or "hi" to the bot`);
//   } else {
//     if (entityChosen === 'wit$greetings') {
//       // send greetings message
//       callSendAPI(senderPSID, 'Hi there! This bot is created by Farmdemy. Learn more on @farmdemy page!');
//     }
//     if (entityChosen === 'wit$thanks') {
//       // send thanks message
//       callSendAPI(senderPSID, `You 're welcome!`);
//     }
//     if (entityChosen === 'wit$bye') {
//       // send bye message
//       callSendAPI(senderPSID, 'bye-bye!');
//     }
//   }
// }

// const postWebhook = catchAsync(async (req, res) => {
//   // Parse the request body from the POST
//   const { body } = req;

//   // Check the webhook event is from a Page subscription
//   if (body.object === 'page') {
//     // Iterate over each entry - there may be multiple if batched
//     body.entry.forEach(function (entry) {
//       // Gets the body of the webhook event
//       const webhookEvent = entry.messaging[0];
//       console.log({ webhookEvent });

//       // Get the sender PSID
//       const senderPSID = webhookEvent.sender.id;
//       logger.info(`Sender PSID: ${senderPSID}`);

//       // Check if the event is a message or postback and
//       // pass the event to the appropriate handler function
//       console.log({ isMessage: webhookEvent.message });
//       if (webhookEvent.message) {
//         handleMessage(senderPSID, webhookEvent.message);
//       } else if (webhookEvent.postback) {
//         handlePostback(senderPSID, webhookEvent.postback);
//       }
//     });

//     // Return a '200 OK' response to all events
//     res.status(200).send('EVENT_RECEIVED');
//   } else {
//     // Return a '404 Not Found' if event is not from a page subscription
//     throw new ApiError(httpStatus.NOT_FOUND, 'Chatbot not found');
//   }
// });

// const getWebhook = catchAsync(async (req, res) => {
//   // Your verify token. Should be a random string.
//   const VERIFY_TOKEN = config.chatbot.verifyToken;

//   // Parse the query params
//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];

//   // Checks if a token and mode is in the query string of the request
//   if (mode && token) {
//     // Checks the mode and token sent is correct
//     if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//       // Responds with the challenge token from the request
//       logger.info('WEBHOOK_VERIFIED');
//       res.status(200).send(challenge);
//     } else {
//       // Responds with '403 Forbidden' if verify tokens do not match
//       throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
//     }
//   } else {
//     // Responds with '400 Bad request' if mode, token, challenge undefined
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Bad request');
//   }
// });

// module.exports = {
//   getWebhook,
//   postWebhook,
// };
