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
//<教材:綁定WaterfallDialog，加入自訂義詢問步驟>
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
                // this.destinationStep.bind(this),
                // this.originStep.bind(this),
                // this.travelDateStep.bind(this),
                // this.confirmStep.bind(this),
                // this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
//</教材:綁定WaterfallDialog，加入自訂義詢問步驟>
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    // async destinationStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     if (!bookingDetails.destination) {
    //         return await stepContext.prompt(TEXT_PROMPT, { prompt: 'To what city would you like to travel?' });
    //     } else {
    //         return await stepContext.next(bookingDetails.destination);
    //     }
    // }

    async askStartDateStep(stepContext){
        const LeaveDetails = stepContext.options;

        if(!LeaveDetails.Date){
            return await stepContext.prompt(TEXT_PROMPT, {prompt: '你什麼時候要請假呢? 請先輸入起始日期及時間:'});
            // await stepContext.context.sendActivity('你什麼時候要請假?請先輸入起始日期及時間:');
            // return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
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

        // return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
    }

    async getEndDateTimeBeginDialog(stepContext){
        return await stepContext.beginDialog(DATE_RESOLVER_DIALOG);
    }

    // async getStartTimeStep(stepContext){
    //     // let LUISresult = await LuisHelper.ParseDateTime(stepContext.context); //回覆格式為ISO_8601，這邊再用Moment.js來轉換成自定義的格式
    //     // let MomentJSResult = moment(LUISresult,moment.ISO_8601).format('YYYY年MM月DD日');
    //     // await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: stepContext.context });
    //     const LeaveDetails = stepContext.options;
    //     LeaveDetails.StartDateTime = MomentJSResult;
    //     // console.log(MomentJSResult);
        
    //     return await stepContext.prompt(CONFIRM_PROMPT,{prompt:`我收到的日期如下「${LeaveDetails.StartDateTime}」，請確認是否正確`});
    // }
    // async ConfirmStartDateTimeStep(stepContext){
    //     if(stepContext.result === true){
    //         return await stepContext.next(true); //正確，不需要重複再輸入一次日期
    //     }
    //     else{
    //         return await stepContext.prompt(TEXT_PROMPT, {prompt:'真抱歉，那請再輸入一次詳細的日期以及時間'});
    //     }
    // }

    // async AgainGetStartDateTimeStep(stepContext){
    //     if(stepContext.result !== true){
    //         let MomentJSResult = moment(stepContext.result,['MM/DD','YYYY/MM/DD','MM-DD','YYYY-MM-DD','MM月DD日','YYYY年MM月DD日']).format('YYYY年MM月DD日');
    //         await stepContext.context.sendActivity(`這是我收到的日期「${MomentJSResult}」`);
            
    //         const LeaveDetails = stepContext.options;
    //         LeaveDetails.StartDateTime = MomentJSResult;
    //     }
        
    //     return stepContext.prompt(TEXT_PROMPT, {prompt: '請輸入假別(例如:事假、病假...))'});
    // }

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

    /**
     * If an origin city has not been provided, prompt for one.
     */
    // async originStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     // Capture the response to the previous step's prompt
    //     bookingDetails.destination = stepContext.result;
    //     if (!bookingDetails.origin) {
    //         return await stepContext.prompt(TEXT_PROMPT, { prompt: 'From what city will you be travelling?' });
    //     } else {
    //         return await stepContext.next(bookingDetails.origin);
    //     }
    // }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
//     async travelDateStep(stepContext) {
//         const bookingDetails = stepContext.options;
// //<教材:加入日期確認的Dialog>
//         // Capture the results of the previous step
//         bookingDetails.origin = stepContext.result;
//         if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
//             return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
//         } else {
//             return await stepContext.next(bookingDetails.travelDate);
//         }
// //</教材:加入日期確認的Dialog>
//     }

    /**
     * Confirm the information the user has provided.
     */
    // async confirmStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     // Capture the results of the previous step
    //     bookingDetails.travelDate = stepContext.result;
    //     const msg = `Please confirm, I have you traveling to: ${ bookingDetails.destination } from: ${ bookingDetails.origin } on: ${ bookingDetails.travelDate }.`;

    //     // Offer a YES/NO prompt.
    //     return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    // }

    /**
     * Complete the interaction and end the dialog.
     */
    // async finalStep(stepContext) {
    //     if (stepContext.result === true) {
    //         const bookingDetails = stepContext.options;

    //         return await stepContext.endDialog(bookingDetails);
    //     } else {
    //         return await stepContext.endDialog();
    //     }
    // }

    // isAmbiguous(timex) {
    //     const timexPropery = new TimexProperty(timex);
    //     return !timexPropery.types.has('definite');
    // }
}

module.exports.BookingDialog = BookingDialog;
