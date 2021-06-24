import request from 'request';
import requestPromise from 'request-promise';

require('dotenv').config();

const URL_SHOW_ROOM_GIF =
  'https://media3.giphy.com/media/TGcD6N8uzJ9FXuDV3a/giphy.gif?cid=ecf05e47afe5be971d1fe6c017ada8e15c29a76fc524ac20&rid=giphy.gif';
const URL_SALAD_GIF =
  'https://media0.giphy.com/media/9Vk8qP9EmWB8FePccb/giphy.gif?cid=ecf05e478d0c93d69e72264c8ebbf58a9a1d7ae294754131&rid=giphy.gif';
const URL_SHOW_FISH =
  'https://res.cloudinary.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_508,h_320,c_fill/ztjeouq2jlas5b2zxksm';
const URL_SHOW_CLASSIC =
  'https://ardo.com/files/attachments/.10202/w1440h700q85_AZ1.jpg';
let getFacebookUsername = (sender_psid) => {
  return new Promise((resolve, reject) => {
    // Send the HTTP request to the Messenger Platform
    let uri = `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${process.env.FB_PAGE_TOKEN}`;
    request(
      {
        uri: uri,
        method: 'GET',
      },
      (err, res, body) => {
        if (!err) {
          //convert string to json object
          body = JSON.parse(body);
          let username = `${body.last_name} ${body.first_name}`;
          resolve(username);
        } else {
          reject('Unable to send message:' + err);
        }
      }
    );
  });
};

let sendResponseWelcomeNewCustomer = (username, sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response_first = {
        text: `Welcome ${username} to Farmdemy's web app`,
      };
      let response_second = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: 'Want to learn something awesome?',
                image_url: 'https://i.imgur.com/MJ6A3Lb.jpg',
                subtitle: 'Watch more courses on our website ^^',
                buttons: [
                  {
                    type: 'postback',
                    title: 'SHOW CATEGORY',
                    payload: 'SHOW_CATEGORY',
                  },
                  {
                    type: 'postback',
                    title: 'SHOW HIGHLIGHT',
                    payload: 'SHOW_COURSE',
                  },
                  {
                    type: 'postback',
                    title: 'GUIDE TO USE THIS BOT',
                    payload: 'GUIDE_BOT',
                  },
                ],
              },
            ],
          },
        },
      };

      //send a welcome message
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response_first);

      //send a image with button view main menu
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response_second);

      resolve('done!');
    } catch (e) {
      reject(e);
    }
  });
};

let sendCategory = async (sender_psid) => {
  const categoriesString = await requestPromise.get({
    url: `${process.env.BACK_END_URL}categories?type=1&limit=10&page=1`,
  });

  const categoriesObj = JSON.parse(categoriesString);

  const coursesTemplate = categoriesObj.map((e) => {
    const item = {
      content_type: 'text',
      title: e.name,
      payload: 'SMALL',
    };

    return item;
  });

  let request_body = {
    recipient: {
      id: sender_id,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: 'Which category do you choose?',
      quick_replies: [coursesTemplate],
    },
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
};

let sendCourseMenu = async (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Which course type do you choose?`,
            buttons: [
              {
                type: 'postback',
                title: 'SEARCH COURSE',
                payload: 'SEARCH COURSE',
              },
              {
                type: 'postback',
                title: 'MOST VIEW COURSES',
                payload: 'MOST_VIEW_COURSES',
              },
              {
                type: 'postback',
                title: 'LASTED COURSES',
                payload: 'LASTED_COURSES',
              },
              {
                type: 'postback',
                title: 'HIGHLIGHT COURSES',
                payload: 'HIGHLIGHT_COURSES',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response);
      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendCourse = async (sender_psid, type) => {
  return new Promise(async (resolve, reject) => {
    try {
      const coursesString = await requestPromise.get({
        url: `${process.env.BACK_END_URL}course?type=${type}&limit=10&page=1`,
      });

      const coursesObj = JSON.parse(coursesString);

      const coursesTemplate = coursesObj.map((e) => {
        const item = {
          title: e.name,
          image_url: e.urlThumb,
          subtitle: e.introDescription,
          buttons: [
            {
              type: 'web_url',
              url: `${process.env.FRONT_END_URL}detail-course/${e.id}`,
              title: 'Watch now',
            },
          ],
        };

        return item;
      });

      const goBackItem = {
        title: 'Go back',
        image_url: ' https://bit.ly/imageToSend',
        buttons: [
          {
            type: 'postback',
            title: 'BACK TO MAIN MENU',
            payload: 'BACK_TO_MAIN_MENU',
          },
          {
            type: 'postback',
            title: 'RESERVE A TABLE',
            payload: 'RESERVE_TABLE',
          },
        ],
      };

      coursesTemplate.push(goBackItem);

      let response = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: coursesTemplate,
          },
        },
      };
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response);
      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendDinnerMenu = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        text: 'Lump crab cocktail\n$25.00',
      };
      let response2 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://djfoodie.com/wp-content/uploads/Crab-Cocktail-3-800.jpg',
          },
        },
      };

      let response3 = {
        text: 'House cured salmon\n$16.00',
      };
      let response4 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://www.thespruceeats.com/thmb/rys3IyH2DB6Ma_r4IQ6emN-2jYw=/4494x3000/filters:fill(auto,1)/simple-homemade-gravlax-recipe-2216618_hero-01-592dadcba64743f98aa1f7a14f81d5b4.jpg',
          },
        },
      };

      let response5 = {
        text: 'Steamed Whole Maine Lobsters\n$35.00',
      };
      let response6 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://portcitydaily.com/wp-content/uploads/For-the-Shell-of-It.jpg',
          },
        },
      };

      let response7 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Back to main menu or make a reservation ?`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response3);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response4);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response5);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response6);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response7);

      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendPubMenu = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        text: 'Hamburger with French Fries\n$19.50',
      };
      let response2 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://previews.123rf.com/images/genmike/genmike1411/genmike141100010/33951440-burger-and-french-fries.jpg',
          },
        },
      };

      let response3 = {
        text: 'Ham and Cheese on a Baguette as Salad or Sandwich\n$21.00',
      };
      let response4 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://s3-ap-southeast-1.amazonaws.com/v3-live.image.oddle.me/product/Blackforesthamcheesebfd18d.jpg',
          },
        },
      };

      let response5 = {
        text: 'Braised short rib salad\n$29.50',
      };
      let response6 = {
        attachment: {
          type: 'image',
          payload: {
            url: 'https://www.bbcgoodfood.com/sites/default/files/styles/recipe/public/recipe_images/ribs_0.jpg?itok=bOf0t_NF',
          },
        },
      };

      let response7 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Back to main menu or make a reservation ?`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response3);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response4);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response5);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response6);

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response7);
      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendAppetizer = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: 'Little Neck Clams on the Half Shell',
                subtitle: 'Dozen - $20.00',
                image_url: 'https://bit.ly/appetizers1',
              },

              {
                title: 'Fresh Oysters',
                subtitle: '1/2 Dozen - $21.00 | Dozen - $40.00',
                image_url: 'https://bit.ly/appetizers2',
              },

              {
                title: 'Lobster Salad',
                subtitle: 'Half Lobster with Avocado and Grapefruit',
                image_url: 'https://bit.ly/appetizers3',
              },

              {
                title: 'Go back',
                image_url: ' https://bit.ly/imageToSend',
                buttons: [
                  {
                    type: 'postback',
                    title: 'SHOW LUNCH MENU',
                    payload: 'BACK_TO_LUNCH_MENU',
                  },
                  {
                    type: 'postback',
                    title: 'BACK TO MAIN MENU',
                    payload: 'BACK_TO_MAIN_MENU',
                  },
                  {
                    type: 'postback',
                    title: 'RESERVE A TABLE',
                    payload: 'RESERVE_TABLE',
                  },
                ],
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response);
    } catch (e) {
      reject(e);
    }
  });
};

let goBackToMainMenu = (sender_psid) => {
  sendMainMenu(sender_psid);
};

let goBackToLunchMenu = (sender_psid) => {
  sendLunchMenu(sender_psid);
};

let handleReserveTable = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let username = await getFacebookUsername(sender_psid);
      let response = {
        text: `Hi ${username}, What time and date you would like to reserve a table ?`,
      };
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response);
    } catch (e) {
      reject(e);
    }
  });
};

let handleShowRooms = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: 'Bull Moose Room',
                subtitle: 'The room is suited for parties of up to 25 people',
                image_url: 'https://bit.ly/showRoom1',
                buttons: [
                  {
                    type: 'postback',
                    title: 'SHOW DESCRIPTION',
                    payload: 'SHOW_ROOM_DETAIL',
                  },
                ],
              },

              {
                title: 'Lillie Langstry Room',
                subtitle: 'The room is suited for parties of up to 35 people',
                image_url: 'https://bit.ly/showRoom2',
                buttons: [
                  {
                    type: 'postback',
                    title: 'SHOW DESCRIPTION',
                    payload: 'SHOW_ROOM_DETAIL',
                  },
                ],
              },

              {
                title: 'Lincoln Room',
                subtitle: 'The room is suited for parties of up to 45 people',
                image_url: 'https://bit.ly/showRoom3',
                buttons: [
                  {
                    type: 'postback',
                    title: 'SHOW DESCRIPTION',
                    payload: 'SHOW_ROOM_DETAIL',
                  },
                ],
              },

              {
                title: 'Go back',
                image_url: ' https://bit.ly/imageToSend',
                buttons: [
                  {
                    type: 'postback',
                    title: 'BACK TO MAIN MENU',
                    payload: 'BACK_TO_MAIN_MENU',
                  },
                  {
                    type: 'postback',
                    title: 'RESERVE A TABLE',
                    payload: 'RESERVE_TABLE',
                  },
                ],
              },
            ],
          },
        },
      };

      //send a welcome message
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response);
    } catch (e) {
      reject(e);
    }
  });
};

let sendMessageAskingQuality = (sender_id) => {
  let request_body = {
    recipient: {
      id: sender_id,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: 'What is your party size ?',
      quick_replies: [
        {
          content_type: 'text',
          title: '1-2',
          payload: 'SMALL',
        },
        {
          content_type: 'text',
          title: '2-5',
          payload: 'MEDIUM',
        },
        {
          content_type: 'text',
          title: 'more than 5',
          payload: 'LARGE',
        },
      ],
    },
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
};

let sendMessageAskingPhoneNumber = (sender_id) => {
  let request_body = {
    recipient: {
      id: sender_id,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: "Thank you. And what's the best phone number for us to reach you at?",
      quick_replies: [
        {
          content_type: 'user_phone_number',
        },
      ],
    },
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
};

let sendMessageDoneReserveTable = async (sender_id) => {
  try {
    let response = {
      attachment: {
        type: 'image',
        payload: {
          url: 'https://bit.ly/giftDonalTrump',
        },
      },
    };
    await sendTypingOn(sender_id);
    await sendMessage(sender_id, response);

    //get facebook username
    let username = await getFacebookUsername(sender_id);

    //send another message
    let response2 = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: `Done! \nOur reservation team will contact you as soon as possible ${username}.\n \nWould you like to check our Main Menu?`,
          buttons: [
            {
              type: 'postback',
              title: 'SHOW MAIN MENU',
              payload: 'MAIN_MENU',
            },
            {
              type: 'phone_number',
              title: '☎ HOT LINE',
              payload: '+911911',
            },
            {
              type: 'postback',
              title: 'START OVER',
              payload: 'RESTART_CONVERSATION',
            },
          ],
        },
      },
    };
    await sendTypingOn(sender_id);
    await sendMessage(sender_id, response2);
  } catch (e) {
    console.log(e);
  }
};

let sendMessageDefaultForTheBot = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        text: "Sorry, I'm just a bot, man ^^ \nYou can test me with all these buttons or try to make a reservation.\n\nThis video may help you to understand me 😉",
      };
      //send a media template
      let response2 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: 'Want to learn something awesome?',
                image_url: 'https://i.imgur.com/MJ6A3Lb.jpg',
                subtitle: 'Watch more courses on our website ^^',
                buttons: [
                  {
                    type: 'web_url',
                    url: 'https://wnc-frontend.farmhub.asia/',
                    title: 'Watch now',
                  },
                  {
                    type: 'postback',
                    title: 'Start over',
                    payload: 'RESTART_CONVERSATION',
                  },
                ],
              },
            ],
          },
        },
      };
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);
      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let showRoomDetail = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        attachment: {
          type: 'image',
          payload: {
            url: URL_SHOW_ROOM_GIF,
          },
        },
      };
      let response2 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `The rooms is suited for parties up to 45 people.`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      resolve('done!');
    } catch (e) {
      reject(e);
    }
  });
};

let sendSalad = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        attachment: {
          type: 'image',
          payload: {
            url: URL_SALAD_GIF,
          },
        },
      };
      let response2 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Entree Salad \n$25.00`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendFish = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        attachment: {
          type: 'image',
          payload: {
            url: URL_SHOW_FISH,
          },
        },
      };
      let response2 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Fish fry \n$60.00`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendClassic = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response1 = {
        attachment: {
          type: 'image',
          payload: {
            url: URL_SHOW_CLASSIC,
          },
        },
      };
      let response2 = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `Perfect oven baked fries \n$30.00`,
            buttons: [
              {
                type: 'postback',
                title: 'SHOW MAIN MENU',
                payload: 'MAIN_MENU',
              },
              {
                type: 'postback',
                title: 'RESERVE A TABLE',
                payload: 'RESERVE_TABLE',
              },
            ],
          },
        },
      };

      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response1);
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response2);

      resolve('done');
    } catch (e) {
      reject(e);
    }
  });
};

let sendMessage = (sender_psid, response) => {
  return new Promise((resolve, reject) => {
    try {
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
          console.log(res);
          console.log(body);
          if (!err) {
            console.log('message sent!');
            resolve('done!');
          } else {
            reject('Unable to send message:' + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

let sendTypingOn = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      let request_body = {
        recipient: {
          id: sender_psid,
        },
        sender_action: 'typing_on',
      };

      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: 'https://graph.facebook.com/v7.0/me/messages',
          qs: { access_token: process.env.FB_PAGE_TOKEN },
          method: 'POST',
          json: request_body,
        },
        (err, res, body) => {
          if (!err) {
            resolve('done!');
          } else {
            reject('Unable to send message:' + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

let markMessageSeen = (sender_psid) => {
  return new Promise((resolve, reject) => {
    try {
      let request_body = {
        recipient: {
          id: sender_psid,
        },
        sender_action: 'mark_seen',
      };

      // Send the HTTP request to the Messenger Platform
      request(
        {
          uri: 'https://graph.facebook.com/v7.0/me/messages',
          qs: { access_token: process.env.FB_PAGE_TOKEN },
          method: 'POST',
          json: request_body,
        },
        (err, res, body) => {
          if (!err) {
            resolve('done!');
          } else {
            reject('Unable to send message:' + err);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  getFacebookUsername,
  sendResponseWelcomeNewCustomer,
  sendCategory,
  sendCourseMenu,
  sendDinnerMenu,
  sendPubMenu,
  sendAppetizer,
  goBackToMainMenu,
  goBackToLunchMenu,
  handleReserveTable,
  handleShowRooms,
  sendMessageAskingQuality,
  sendMessageAskingPhoneNumber,
  sendMessageDoneReserveTable,
  sendMessageDefaultForTheBot,
  showRoomDetail,
  sendSalad,
  sendFish,
  sendClassic,
  markMessageSeen,
  sendTypingOn,
  sendMessage,
};
