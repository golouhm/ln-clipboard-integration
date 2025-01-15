import {
    IAppAccessors,
    ILogger,
    IRead,
    IHttp,
    IMessageBuilder,
    IPersistence
//    IEnvironmentRead,
//    IConfigurationModify,
//    IConfigurationExtend
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IMessage, IPreMessageSentModify } from '@rocket.chat/apps-engine/definition/messages';
//import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
//import { settings } from './settings';

export class LnClipboardIntegrationApp extends App implements IPreMessageSentModify {
    private matcher: RegExp = /^[^\n]+?\n<NDL>.*?<\/NDL>/gsm;
    private matcherNonGlobal: RegExp = /^[^\n]+?\n<NDL>.*?<\/NDL>/sm;
    private serverFixRegex: RegExp = /CN=(\w+)\/O=(\w+)/s;

    /**
     * LN Domino translate private server name to DNS entry
     */
    public serverTranslate: string = '';

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

//Document name
//<NDL>
//<REPLICA C125719D:002967C4>
//<VIEW OF38D46BF5:E8F08834-ON852564B5:00129B2C>
//<NOTE OF54DE05C3:B4B3D8FD-ON7507338F:45910C91>
//<HINT>   server.example.com/</HINT>
//<REM>Database 'Database name', View 'View', Document 'Document name'</REM>
//</NDL>

//notes://server.example.com/C125719D002967C4/38D46BF5E8F08834852564B500129B2C/54DE05C3B4B3D8FD7507338F45910C91

/**
   * Loads the room where to get members from
   * Loads the room where to post messages to
   * Loads the user who'll be posting messages as the botUser
   *
   * @param environmentRead
   * @param configModify
   */
//  public async onEnable(environmentRead: IEnvironmentRead, configModify: IConfigurationModify): Promise<boolean> {
//      this.serverTranslate = await environmentRead.getSettings().getValueById('server_translate');
//      return true;
//  }


    public async checkPreMessageSentModify(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        if (typeof message.text !== 'string') {
            return false;
        }

        const result = message.text.match(this.matcher);

        return result ? (result.length !== 0 ): false;
    }

    public async executePreMessageSentModify(message: IMessage, builder: IMessageBuilder, read: IRead, http: IHttp,
                                             persistence: IPersistence): Promise<IMessage>
    {
        if  ( typeof message.text !== 'string' ) {
            return message;
        }

        // break the textblock into an array of lines

        var messageText = message.text;
        const result = message.text.match(this.matcher);
        if (result) {
          for (var i = 0; i < result.length; i++) {
              var lines = result[i].split("\n");

              var replica =  lines[2].split(' ')[1].slice(0, -1).replace(/:/g,"");
              var view =     lines[3].split(' ')[1].slice(0, -1).replace(/:/g,"").replace(/-ON/g,"").substr(2);
              var note =     lines[4].split(' ')[1].slice(0, -1).replace(/:/g,"").replace(/-ON/g,"").substr(2);
              //<HINT>   server.example.com/</HINT>
              //<HINT>CN=GOLOB/O=3GEN</HINT>
              var serverFixNeeded = lines[5].match(this.serverFixRegex);
              if (serverFixNeeded) {
                lines[5] = lines[5].replace(this.serverFixRegex, ' $1.trigen.si');
              }
              var server =   lines[5].slice(0, -8).substr(7).trim().toLowerCase();
              var desc =     lines[6].slice(0, -6).substr(5);

              var url = 'notes://' + server + '/' + replica + '/' + view + '/' + note;

              //<REM>Database 'Database name', View 'View', Document 'Document name'</REM>
              // <REM>Oracle baze podatkov</REM>
              if (desc.startsWith('Database \'')) {
                var matches = desc.match(/Database '(.*)', View '(.*)', Document '(.*)'/);
                if (matches != null) {
                  var databaseText = matches[1];
                  var viewText =  matches[2];
                  var docText = matches[3].replace("(","").replace(")","");
                  var newText = "**Lotus Domino Database: ** "+databaseText+"\n**View: ** "+viewText+"\n**Document title: ** ["+docText+"]" + "(" + url + ")";
                } else {
                  var newText = "Unexpected format of LN link XML:\n```"+desc+"```";  
                }
                
                //var newText = "**Lotus Domino Database: ** "+databaseText+"\n*View: ** "+viewText+"\n*Document title: ** ["+docText+"]") + "(" + url + ")";
                //var newText = desc.replace(/Database '(.*)', View '(.*)', Document '(.*)'/g,"*Lotus Domino Database:* $1\n*View:* $2\n*Document title:* [$3]") + "(" + url + ")";
              } else {
                var newText = "**Lotus Domino Database: ** " + desc + "\n["+lines[0]+"]" + "(" + url + ")";
              }
              messageText = messageText.replace(this.matcherNonGlobal, newText);
          }

          return builder.setText( messageText ).getMessage();
        }
        else {
           return message;
        }
    }

//    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
//        // Settings
//        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
//    }

}
