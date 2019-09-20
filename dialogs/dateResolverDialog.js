// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, ConfirmPrompt, DateTimePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { LuisHelper } = require('./luisHelper');
const moment = require('moment');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
// const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class DateResolverDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'dateResolverDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.FirstGetDateTimeStep.bind(this),
                this.GetConfirm.bind(this),
                this.GetAgainDateTime.bind(this),
                this.GetConfirmAgain.bind(this),
                this.GetDateAgainReplaceDialog.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    
    

    async FirstGetDateTimeStep(stepContext) {
        let LUISresult = await LuisHelper.ParseDateTime(stepContext.context); //回覆格式為ISO_8601，這邊再用Moment.js來轉換成自定義的格式
        let MomentJSResult = moment(LUISresult,moment.ISO_8601).format('YYYY年MM月DD日 HH:mm');
        
        const LeaveDetails = stepContext.options;
        LeaveDetails.DateTime = MomentJSResult;
        // console.log(MomentJSResult);
        
        return await stepContext.prompt(CONFIRM_PROMPT,{prompt:`我收到的日期如下「${LeaveDetails.DateTime}」，請確認是否正確`});

        // const timex = stepContext.options.date;

        // const promptMessageText = 'On what date would you like to travel?';
        // const promptMessage = MessageFactory.text(promptMessageText, promptMessageText, InputHints.ExpectingInput);

        // const repromptMessageText = "I'm sorry, for best results, please enter your travel date including the month, day and year.";
        // const repromptMessage = MessageFactory.text(repromptMessageText, repromptMessageText, InputHints.ExpectingInput);

        // if (!timex) {
        //     // We were not given any date at all so prompt the user.
        //     return await stepContext.prompt(DATETIME_PROMPT,
        //         {
        //             prompt: promptMessage,
        //             retryPrompt: repromptMessage
        //         });
        // }
        // // We have a Date we just need to check it is unambiguous.
        // const timexProperty = new TimexProperty(timex);
        // if (!timexProperty.types.has('definite')) {
        //     // This is essentially a "reprompt" of the data we were given up front.
        //     return await stepContext.prompt(DATETIME_PROMPT, { prompt: repromptMessage });
        // }
        // return await stepContext.next([{ timex: timex }]);
    }

    async GetConfirm(stepContext){
        if(stepContext.result === true){
            const LeaveDetails = stepContext.options;
            return await stepContext.endDialog(LeaveDetails.DateTime);
        }
        else{
            return await stepContext.prompt(TEXT_PROMPT, {prompt:'請再輸入一次詳細的日期以及時間:'});
        }
    }

    async GetAgainDateTime(stepContext){
        const LeaveDetails = stepContext.options;

        let MomentJSResult = moment(stepContext.result,['MM/DD HH:mm','YYYY/MM/DD HH:mm','MM-DD HH:mm','YYYY-MM-DD HH:mm','MM月DD日HH:mm','YYYY年MM月DD日 HH:mm']).format('YYYY年MM月DD日HH:mm');
        LeaveDetails.DateTime = MomentJSResult;
        return await stepContext.prompt(CONFIRM_PROMPT,{prompt:`我收到的日期如下「${LeaveDetails.DateTime}」，請確認是否正確`});
    }

    async GetConfirmAgain(stepContext){
        const LeaveDetails = stepContext.options;

        if(stepContext.result === true){
            // const LeaveDetails = stepContext.options;
            return await stepContext.endDialog(LeaveDetails.DateTime);
        }
        else{
            return await stepContext.prompt(TEXT_PROMPT, {prompt:'請再輸入一次詳細的日期以及時間:'});
            // return await stepContext.replaceDialog('dateResolverDialog');
        }
    }

    async GetDateAgainReplaceDialog(stepContext){
        return await stepContext.replaceDialog('dateResolverDialog');
    }

    // async finalStep(stepContext) {
    //     const timex = stepContext.result[0].timex;
    //     return await stepContext.endDialog(timex);
    // }

    // async dateTimePromptValidator(promptContext) {
    //     if (promptContext.recognized.succeeded) {
    //         // This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
    //         // TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
    //         const timex = promptContext.recognized.value[0].timex.split('T')[0];

    //         // If this is a definite Date including year, month and day we are good otherwise reprompt.
    //         // A better solution might be to let the user know what part is actually missing.
    //         return new TimexProperty(timex).types.has('definite');
    //     }
    //     return false;
    // }
}

module.exports.DateResolverDialog = DateResolverDialog;
