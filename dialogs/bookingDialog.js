// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');
const { LuisHelper } = require('./luisHelper');



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

        if(!LeaveDetails.Date){
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '你什麼時候要請假呢? 請先輸入起始日期及時間:'});
            
        }
        else{
            return await stepContext.next(LeaveDetails.Date);
        }
    }

    async getStartDateTimeBeginDialog(stepContext){
        return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
    }

    async askEndDateTime(stepContext){
        const LeaveDetails = stepContext.options;
        LeaveDetails.StartDateTime = stepContext.result;
        return await stepContext.prompt(TEXT_PROMPT, {prompt: '請再輸入結束日期及時間:'});

    }

    async getEndDateTimeBeginDialog(stepContext){
        return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
    }

    

    async GetDateAskType(stepContext){
        const LeaveDetails = stepContext.options;
        LeaveDetails.EndDateTime = stepContext.result;

        if(!LeaveDetails.Type){
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '請輸入假別(例如:事假、病假...))'});
        }
    }

    async GetTypeConfirm(stepContext){
        const LeaveDetails = stepContext.options;

        LeaveDetails.Type = stepContext.result;
        let msg = `請確認以下資訊是否正確: 起始日期:${LeaveDetails.StartDateTime}，結束日期:${LeaveDetails.EndDateTime} 假別:${LeaveDetails.Type}`;

        return await stepContext.prompt(CONFIRM_PROMPT, {prompt:msg});
    }

    async finalStep(stepContext){
        if(stepContext.result === true){
            const LeaveDetails = stepContext.options;
            return await stepContext.endDialog(LeaveDetails);
        }
        else{
            return await stepContext.endDialog();
        }
    }

    
}

module.exports.BookingDialog = BookingDialog;
