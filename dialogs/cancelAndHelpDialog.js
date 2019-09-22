// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints } = require('botbuilder');
const { ComponentDialog, DialogTurnStatus } = require('botbuilder-dialogs');

/**
 * This base class watches for common phrases like "help" and "cancel" and takes action on them
 * BEFORE they reach the normal bot logic.
 */
class CancelAndHelpDialog extends ComponentDialog {
    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
            case 'help':
            case '?':
                await innerDc.context.sendActivity('請問有需要幫忙嗎? 如果日期一直輸入不正確，請依照例句「2019-09-12 14:20」的格式輸入，我會比較好理解');
                return { status: DialogTurnStatus.waiting };
            case 'cancel':
            case 'quit':
            case '取消':
            case '掰掰':
                await innerDc.context.sendActivity('了解，取消了!');
                return await innerDc.cancelAllDialogs();
            }
        }
    }
}

module.exports.CancelAndHelpDialog = CancelAndHelpDialog;
