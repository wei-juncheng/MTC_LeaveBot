// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { BookingDialog } = require('./bookingDialog');
const { LuisHelper } = require('./luisHelper');
const { CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
// const { CardFactory } = require('botbuilder');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const BOOKING_DIALOG = 'bookingDialog';

class MainDialog extends ComponentDialog {
    constructor() {
        super('MainDialog');
        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new BookingDialog(BOOKING_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor, userProfile) {
        this.userProfile = userProfile;//使用者資訊

        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    
    async introStep(stepContext) {
        if (!process.env.LuisAppId || !process.env.LuisAPIKey || !process.env.LuisAPIHostName) {
            await stepContext.context.sendActivity('NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.');
            return await stepContext.next();
        }

        return await stepContext.prompt('TextPrompt', { prompt: `Hi,${stepContext.context.activity.from.name}.  我是負責處理請假的機器人，請問你是要請假嗎?` });
    }

    
    async actStep(stepContext) {
        let LUISReturnObject = {};

        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Call LUIS and gather any potential booking details.
            // This will attempt to extract the origin, destination and travel date from the user's message
            // and will then pass those values into the booking dialog
            LUISReturnObject = await LuisHelper.ParseAllEntity(stepContext.context);
        }

        // In this sample we only have a single intent we are concerned with. However, typically a scenario
        // will have multiple different intents each corresponding to starting a different child dialog.
        if(LuisRecognizer.topIntent(LUISReturnObject) === '查詢請假紀錄'){
            await stepContext.context.sendActivity('以下是你的請假紀錄: ');
            let Attachments = await MainDialog.GetLeaveHistory(this.userProfile.History, stepContext);
            await stepContext.context.sendActivity({ attachments: Attachments });
            return await stepContext.endDialog();
        }
        // Run the BookingDialog giving it whatever details we have from the LUIS call, it will fill out the remainder.
        return await stepContext.beginDialog('bookingDialog',LUISReturnObject);

    }

    
    async finalStep(stepContext) {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            
            
            // await stepContext.context.sendActivity('已完成請假手續，謝謝您 !');
            // const msg = `起始日期:${result.StartDateTime} 結束日期:${result.EndDateTime} 假別:${result.Type} `;
            // await stepContext.context.sendActivity(msg);

            //儲存資料
            let LeaveData = {StartDateTime:result.StartDateTime, EndDateTime:result.EndDateTime, Type: result.Type};
            this.userProfile.History.push(LeaveData);

            console.log(stepContext.context.activity.from.name + '目前有' + this.userProfile.History.length + '個紀錄!!');
            await stepContext.context.sendActivity('已完成請假手續，謝謝您');
        } else {
            await stepContext.context.sendActivity('謝謝~');
        }
        return await stepContext.endDialog();
    }

    static async GetLeaveHistory(History, stepContext){
        let Attachment = [];
        History.forEach(element => {
            // console.log(element.StartDateTime);
            let welcomeCard = CardFactory.adaptiveCard({
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "size": "Large",
                        "weight": "Bolder",
                        "text": "請假單",
                        "horizontalAlignment": "Center"
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "姓名:",
                                "value": `${stepContext.context.activity.from.name}`
                            },
                            {
                                "title": "起始時間:",
                                "value": `${element.StartDateTime}`
                            },
                            {
                                "title": "結束時間:",
                                "value": `${element.EndDateTime}`
                            },
                            {
                                "title": "假別",
                                "value": `${element.Type}`
                            }
                        ],
                        "spacing": "Medium"
                    }
                ],
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0"
            });

            Attachment.push(welcomeCard);

        });
        


        return Attachment;
    }
}

module.exports.MainDialog = MainDialog;
