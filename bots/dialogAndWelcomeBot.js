// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder');
const { DialogBot } = require('./dialogBot');
// const WelcomeCard = require('./resources/welcomeCard.json');

class DialogAndWelcomeBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    // const welcomeCard = CardFactory.adaptiveCard({
                    //     "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    //     "type": "AdaptiveCard",
                    //     "version": "1.0",
                    //     "body": [
                          
                    //       {
                    //         "type": "TextBlock",
                    //         "spacing": "medium",
                    //         "size": "default",
                    //         "weight": "bolder",
                    //         "text": "假單",
                    //         "wrap": true,
                    //         "maxLines": 0
                    //       },
                    //       {
                    //         "type": "TextBlock",
                    //         "size": "default",
                    //         "isSubtle": "yes",
                    //         "text": "以下是我收到的請假資訊",
                    //         "wrap": true,
                    //         "maxLines": 0
                    //       },
                    //       {
                    //         "type": "Container",
                    //         "items": [
                              
                    //           {
                    //             "type": "FactSet",
                    //             "facts": [
                    //               {
                    //                 "title": "姓名:",
                    //                 "value": "Adaptive Card"
                    //               },
                    //               {
                    //                 "title": "起始日期時間:",
                    //                 "value": "Backlog"
                    //               },
                    //               {
                    //                 "title": "結束日期時間:",
                    //                 "value": "Matt Hidinger"
                    //               },
                    //               {
                    //                 "title": "假別:",
                    //                 "value": "Not set"
                    //               }
                    //             ]
                    //           }
                    //         ]
                    //       }
                    //     ]
                    //   });
                    // await context.sendActivity({ attachments: [welcomeCard] });
                    await context.sendActivity('嗨!'+context.activity.from.name);
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.DialogAndWelcomeBot = DialogAndWelcomeBot;
