// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, ConfirmPrompt, DateTimePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
// const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { LuisHelper } = require('./luisHelper');
const moment = require('moment');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
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
        if(typeof LUISresult === 'undefined'){
            return await stepContext.next(false); //LUIS解析結果錯誤，請再輸入一次
        }

        let MomentJSResult = moment(LUISresult,moment.ISO_8601).format('YYYY年MM月DD日 HH:mm');
        
        const LeaveDetails = stepContext.options;
        LeaveDetails.DateTime = MomentJSResult;
        
        
        return await stepContext.prompt(CONFIRM_PROMPT,{prompt:`我收到的日期如下「${LeaveDetails.DateTime}」，請確認是否正確`});

        
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

        if(!moment(stepContext.result).isValid()){
            return await stepContext.next(false);
        }

        let MomentJSResult = moment(stepContext.result,['MM/DD HH:mm','YYYY/MM/DD HH:mm','MM-DD HH:mm','YYYY-MM-DD HH:mm','MM月DD日HH:mm','YYYY年MM月DD日 HH:mm']).format('YYYY年MM月DD日HH:mm');
        LeaveDetails.DateTime = MomentJSResult;
        return await stepContext.prompt(CONFIRM_PROMPT,{prompt:`我收到的日期如下「${LeaveDetails.DateTime}」，請確認是否正確`});
    }

    async GetConfirmAgain(stepContext){
        const LeaveDetails = stepContext.options;

        if(stepContext.result === true){
            return await stepContext.endDialog(LeaveDetails.DateTime);
        }
        else{
            return await stepContext.prompt(TEXT_PROMPT, {prompt:'請再輸入一次詳細的日期以及時間:'});
            
        }
    }

    async GetDateAgainReplaceDialog(stepContext){
        return await stepContext.replaceDialog('dateResolverDialog');
    }

    
}

module.exports.DateResolverDialog = DateResolverDialog;
