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
        else{
            result.entities.datetime[0].timex[0] = result.entities.datetime[0].timex[0].replace('XXXX',moment().format('YYYY')); //如果年份輸入模糊，直接取代成今年
            if(result.entities.datetime[0].type === 'datetime' && moment(result.entities.datetime[0].timex[0]).isValid()){
                return result.entities.datetime[0].timex[0];
            }
            else{
                if(moment(context.activity.text).isValid()){
                    return moment(context.activity.text,['MM/DD HH:mm','YYYY/MM/DD HH:mm','MM-DD HH:mm','YYYY-MM-DD HH:mm','MM月DD日HH:mm','YYYY年MM月DD日 HH:mm']).toISOString(true);
                }
                else{
                    return undefined;
                }
                
            }
        }
        
        

    }

    static parseCompositeEntity(result, compositeName, entityName) {
        const compositeEntity = result.entities[compositeName];
        if (!compositeEntity || !compositeEntity[0]) return undefined;

        const entity = compositeEntity[0][entityName];
        if (!entity || !entity[0]) return undefined;

        const entityValue = entity[0][0];
        return entityValue;
    }

    static parseDatetimeEntity(result) {
        const datetimeEntity = result.entities['datetime'];
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0]['timex'];
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.LuisHelper = LuisHelper;
