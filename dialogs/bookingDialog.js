// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { LuisHelper } = require('./luisHelper');
const { CardFactory } = require('botbuilder');


const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const CONFIRM_PROMPT = 'confirmPrompt';

class BookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'bookingDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.askStartDateStep.bind(this),
                this.getStartDateTimeBeginDialog.bind(this),
                this.askEndDateTime.bind(this),
                this.getEndDateTimeBeginDialog.bind(this),
                this.GetDateAskType.bind(this),
                this.GetTypeConfirm.bind(this),
                this.finalStep.bind(this)
                
            ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }


    async askStartDateStep(stepContext){
        const LeaveDetails = stepContext.options;

        if(!LeaveDetails.StartDateTime){
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '你什麼時候要請假呢? 請先輸入起始日期及時間:'});
            
        }
        else{
            return await stepContext.next();
        }
    }

    async getStartDateTimeBeginDialog(stepContext){
        const LeaveDetails = stepContext.options;

        if(!LeaveDetails.StartDateTime){
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
        }
        else{
            return await stepContext.next();
        }
        
    }

    async askEndDateTime(stepContext){
        const LeaveDetails = stepContext.options;
        if(!LeaveDetails.StartDateTime){ //如果StartDateTime不存在，才要加進去
            LeaveDetails.StartDateTime = stepContext.result;
        }

        if(!LeaveDetails.EndDateTime){ //如果EndDateTime不存在
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '請輸入結束日期及時間:'});
        }
        else{
            return await stepContext.next();
        }
        
        

    }

    async getEndDateTimeBeginDialog(stepContext){
        const LeaveDetails = stepContext.options;
        if(!LeaveDetails.EndDateTime){
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
        }
        else{
            return await stepContext.next();
        }
        
    }

    

    async GetDateAskType(stepContext){
        const LeaveDetails = stepContext.options;
        if(!LeaveDetails.EndDateTime){
            LeaveDetails.EndDateTime = stepContext.result;
        }
        

        if(!LeaveDetails.Type){
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '請輸入假別(例如:事假、病假...))'});
        }
        else{
            return await stepContext.next();
        }
    }

    async GetTypeConfirm(stepContext){
        const LeaveDetails = stepContext.options;

        if(!LeaveDetails.Type){
            LeaveDetails.Type = stepContext.result;
        }

        if(LeaveDetails.StartDateTime === LeaveDetails.EndDateTime){
            LeaveDetails.StartDateTime = LeaveDetails.StartDateTime.concat(' 08:00');
            LeaveDetails.EndDateTime = LeaveDetails.EndDateTime.concat('17:00');
        }
        

        const welcomeCard = CardFactory.adaptiveCard({
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
                    "type": "TextBlock",
                    "text": "以下是本次申請的請假資訊",
                    "wrap": true,
                    "size": "Small"
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
                            "value": `${LeaveDetails.StartDateTime}`
                        },
                        {
                            "title": "結束時間:",
                            "value": `${LeaveDetails.EndDateTime}`
                        },
                        {
                            "title": "假別",
                            "value": `${LeaveDetails.Type}`
                        }
                    ],
                    "spacing": "Medium"
                }
            ],
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0"
        });
        await stepContext.context.sendActivity({ attachments: [welcomeCard] });

        return await stepContext.prompt(CONFIRM_PROMPT, {prompt:'請確認以上資訊是否正確'});
    }

    async finalStep(stepContext){
        if(stepContext.result === true){
            const LeaveDetails = stepContext.options;
            return await stepContext.endDialog(LeaveDetails);
        }
        else{
            await stepContext.context.sendActivity('已刪除本次請假資訊，請重新輸入');
            return await stepContext.endDialog();
        }
    }

    
}

module.exports.BookingDialog = BookingDialog;
