// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');
const moment = require('moment');

class LuisHelper {
    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    static async executeLuisQuery(context) {
        // const bookingDetails = {};
        let recognizerResult;
        try {
            const recognizer = new LuisRecognizer({
                applicationId: process.env.LuisAppId,
                endpointKey: process.env.LuisAPIKey,
                endpoint: `https://${ process.env.LuisAPIHostName }`
            }, {}, true);

            recognizerResult = await recognizer.recognize(context);

            
            
        } catch (err) {
            console.warn(`LUIS Exception: ${ err } Check your LUIS configuration`);
        }
        return recognizerResult;
    }

    static async ParseDateTime(context){
        let result = await LuisHelper.executeLuisQuery(context);
        if(!result.entities.hasOwnProperty('datetime')){
            return undefined;
        }
        else{ //datetime這個property存在
            result.entities.datetime[0].timex[0] = result.entities.datetime[0].timex[0].replace('XXXX',moment().format('YYYY')); //如果年份輸入模糊，直接取代成今年
            if(result.entities.datetime[0].type === 'datetime' && moment(result.entities.datetime[0].timex[0]).isValid()){
                return result.entities.datetime[0].timex[0];
            }
            else{ //如果使用者輸入的語法LUIS無法完整識別，就直接將整句話輸入Moment.js看看，是否可以解析出日期
                if(moment(context.activity.text,['MM/DD HH:mm','YYYY/MM/DD HH:mm','MM-DD HH:mm','YYYY-MM-DD HH:mm','MM月DD日HH:mm','YYYY年MM月DD日 HH:mm']).isValid()){
                    return moment(context.activity.text,['MM/DD HH:mm','YYYY/MM/DD HH:mm','MM-DD HH:mm','YYYY-MM-DD HH:mm','MM月DD日HH:mm','YYYY年MM月DD日 HH:mm']).toISOString(true);
                }
                else{
                    return undefined;
                }
                
            }
        }
        
    }

    static async ParseAllEntity(context){
        let result = await LuisHelper.executeLuisQuery(context);
        // console.log(result);
        const intent = LuisRecognizer.topIntent(result);
        if(intent==='請假'){
            let LeaveDetails = {};
            let LUISEntities = result.entities;
            if(LUISEntities.hasOwnProperty('Type')){
                LeaveDetails.Type = LUISEntities.Type[0];
            }

            if(LUISEntities.hasOwnProperty('datetime')){
                if(LUISEntities.datetime[0].type === 'datetimerange'){
                    
                    let TimexArrary =  LUISEntities.datetime[0].timex[0].substring(1,LUISEntities.datetime[0].timex[0].length-1).split(',');
                    
                    //StartDateTime
                    let StartDateTime = TimexArrary[0].replace('XXXX',moment().format('YYYY')); //如果年份是模糊的，那就取代成今年
                    LeaveDetails.StartDateTime = moment(StartDateTime, moment.ISO_8601).format('YYYY年MM月DD日 HH:mm');

                    //EndDateTime
                    let EndDateTime = TimexArrary[1].replace('XXXX',moment().format('YYYY')); //如果年份是模糊的，那就取代成今年
                    LeaveDetails.EndDateTime = moment(EndDateTime, moment.ISO_8601).format('YYYY年MM月DD日 HH:mm');
                }
                else if(LUISEntities.datetime[0].type === 'datetime'){
                    let StartDateTime = LUISEntities.datetime[0].timex[0].replace('XXXX',moment().format('YYYY'));
                    LeaveDetails.StartDateTime = moment(StartDateTime, moment.ISO_8601).format('YYYY年MM月DD日 HH:mm');
                }
            }

            return LeaveDetails;
        }
        else{
            return result; //如果不是要請假的，那就把LUIS回傳的結果整個return回去
        }
    }

    
}

module.exports.LuisHelper = LuisHelper;
