import request from 'request';
import requestPromise from 'request-promise';

require('dotenv').config();

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
                    title: 'Show categories',
                    payload: 'SHOW_CATEGORY',
                  },
                  {
                    type: 'postback',
                    title: 'Show courses',
                    payload: 'SHOW_COURSE',
                  },
                  {
                    type: 'postback',
                    title: 'Search name of course',
                    payload: 'SEARCH_COURSES',
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

let sendMainMenu = (sender_psid) => {
  return new Promise(async (resolve, reject) => {
    try {
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
                    title: 'SHOW COURSE',
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

      //send a image with button view main menu
      await sendTypingOn(sender_psid);
      await sendMessage(sender_psid, response_second);

      resolve('done!');
    } catch (e) {
      reject(e);
    }
  });
};

let sendCategories = async (sender_psid) => {
  await markMessageSeen(sender_psid);
  await sendTypingOn(sender_psid);

  const categoriesString = await requestPromise.get({
    url: `${process.env.BACK_END_URL}categories?type=1&limit=10&page=1`,
  });

  const categoriesObj = JSON.parse(categoriesString);

  const categoriesTemplate = categoriesObj.map((e) => {
    const item = {
      content_type: 'text',
      title: e.name,
      payload: `CATEGORY_ID_${e._id}`,
    };

    return item;
  });

  let request_body = {
    recipient: {
      id: sender_psid,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: 'Which category do you choose?',
      quick_replies: categoriesTemplate,
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

let sendSubCategories = async (sender_psid, categoryID) => {
  const categoriesString = await requestPromise.get({
    url: `${process.env.BACK_END_URL}categories?type=1&limit=10&page=1`,
  });

  const categoriesObj = JSON.parse(categoriesString);

  const idxCategory = categoriesObj.findIndex((e) => e._id === categoryID);

  if (idxCategory === -1) {
    return sendCategory(sender_psid);
  }

  const subCategoriesTemplate = categoriesObj[idxCategory].subCategories.map(
    (e) => {
      const item = {
        content_type: 'text',
        title: e.name,
        payload: `SUB_CATEGORY_ID_${e._id}`,
      };

      return item;
    }
  );

  let request_body = {
    recipient: {
      id: sender_psid,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: 'Which sub category do you choose?',
      quick_replies: subCategoriesTemplate,
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
                title: 'Latest courses',
                payload: 'LATEST_COURSES',
              },
              {
                type: 'postback',
                title: 'Most view courses',
                payload: 'MOST_VIEW_COURSES',
              },
              {
                type: 'postback',
                title: 'Highlight course',
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

let getTypingNameCourses = (sender_id) => {
  let request_body = {
    recipient: {
      id: sender_id,
    },
    messaging_type: 'RESPONSE',
    message: {
      text: 'Enter the name of course you are looking for?',
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
      uri: 'https://graph.facebook.com/v11.0/me/messages',
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

let sendCourses = async (sender_psid, type, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { subCategoryID, name } = payload;
      let coursesString;
      let coursesObj;

      if (type === 4) {
        if (subCategoryID !== undefined && name !== '' && name !== undefined) {
          coursesString = await requestPromise.get({
            url: `${process.env.BACK_END_URL}courses?type=${type}&subCategory=${subCategoryID}&name=${name}&limit=3&page=1`,
          });

          coursesObj = JSON.parse(coursesString).courses;
        } else if (subCategoryID !== undefined) {
          coursesString = await requestPromise.get({
            url: `${process.env.BACK_END_URL}courses?type=${type}&subCategory=${subCategoryID}&limit=3&page=1`,
          });

          coursesObj = JSON.parse(coursesString).courses;
        } else if (name !== '' && name !== undefined) {
          coursesString = await requestPromise.get({
            url: `${process.env.BACK_END_URL}courses?type=${type}&name=${name}&limit=3&page=1`,
          });

          coursesObj = JSON.parse(coursesString).courses;
        }
      } else if (type === 1) {
        coursesString = await requestPromise.get({
          url: `${process.env.BACK_END_URL}courses?type=${type}&limit=3&page=1`,
        });

        coursesObj = JSON.parse(coursesString);
      } else if (type === 2) {
        coursesString = await requestPromise.get({
          url: `${process.env.BACK_END_URL}courses?type=${type}&limit=3&page=1`,
        });

        coursesObj = JSON.parse(coursesString);
      } else if (type === 3) {
        coursesString = await requestPromise.get({
          url: `${process.env.BACK_END_URL}courses?type=${type}&limit=3&page=1`,
        });

        coursesObj = JSON.parse(coursesString);
      } else {
        return sendMainMenu(sender_psid);
      }

      const coursesTemplate = coursesObj.map((e) => {
        const item = {
          title: `${e.name} - Fee: ${e.fee} $`,
          image_url: e.urlThumb,
          // text: `fee ${e.fee}`,
          buttons: [
            {
              type: 'postback',
              title: 'Show detail',
              payload: `SHOW_DETAIL_${e._id}`,
            },
          ],
        };

        return item;
      });

      const goBackItem = {
        title: 'Go back',
        buttons: [
          {
            type: 'postback',
            title: 'Back to main menu',
            payload: 'BACK_TO_MAIN_MENU',
          },
          {
            type: 'postback',
            title: 'Finish',
            payload: 'SHOW_FINISH',
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

let sendDetailCourse = async (sender_psid, courseID) => {
  return new Promise(async (resolve, reject) => {
    try {
      const courseString = await requestPromise.get({
        url: `${process.env.BACK_END_URL}courses/${courseID}`,
      });

      const courseObj = JSON.parse(courseString);

      const coursesTemplate = [
        {
          title: `${courseObj.name} - Fee: ${courseObj.fee} $`,
          image_url: courseObj.url,
          subtitle: courseObj.introDescription,
          // text: `fee ${courseObj.fee}`,
          buttons: [
            {
              type: 'web_url',
              url: `${process.env.FRONT_END_URL}detail-course/${courseObj._id}`,
              title: 'Watch now',
            },
          ],
        },
      ];

      const goBackItem = {
        title: 'Go back',
        buttons: [
          {
            type: 'postback',
            title: 'Back to main menu',
            payload: 'BACK_TO_MAIN_MENU',
          },
          {
            type: 'postback',
            title: 'Finish',
            payload: 'SHOW_FINISH',
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

let goBackToMainMenu = (sender_psid) => {
  sendMainMenu(sender_psid);
};

let sendMessageGoodBye = async (sender_id) => {
  try {
    let response = {
      attachment: {
        type: 'image',
        payload: {
          url: 'https://i.imgur.com/MJ6A3Lb.jpg',
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
          text: `Goodbye ${username}.\nWould you like to visit our website?`,
          buttons: [
            {
              type: 'web_url',
              url: `${process.env.FRONT_END_URL}`,
              title: 'Visit now',
            },
            {
              type: 'phone_number',
              title: '☎ HOT LINE',
              payload: '+911911',
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
        text: "Sorry, I'm just a bot, man ^^ \nYou can test me with all these buttons or try to\n\nThis video may help you to understand me 😉",
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
                    type: 'postback',
                    title: 'SHOW CATEGORY',
                    payload: 'SHOW_CATEGORY',
                  },
                  {
                    type: 'postback',
                    title: 'SHOW COURSE',
                    payload: 'SHOW_COURSE',
                  },
                  {
                    type: 'postback',
                    title: 'Search name of course',
                    payload: 'SEARCH_COURSES',
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
          uri: 'https://graph.facebook.com/v11.0/me/messages',
          qs: { access_token: process.env.FB_PAGE_TOKEN },
          method: 'POST',
          json: request_body,
        },
        (err, res, body) => {
          // console.log(res);
          // console.log(body);
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
          uri: 'https://graph.facebook.com/v11.0/me/messages',
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
          uri: 'https://graph.facebook.com/v11.0/me/messages',
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
  sendMainMenu,
  sendCategories,
  sendSubCategories,
  sendCourseMenu,
  sendCourses,
  sendDetailCourse,
  getTypingNameCourses,
  goBackToMainMenu,
  sendMessageGoodBye,
  sendMessageDefaultForTheBot,
  markMessageSeen,
  sendTypingOn,
  sendMessage,
};
