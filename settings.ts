import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
export const settings: Array<ISetting> = [
    {
        id: 'server_translate',
        type: SettingType.STRING,
        packageValue: '',
        required: false,
        public: false,
        multiline: true,  // this is not working
        i18nLabel: 'Domino server names translation',
        i18nDescription: 'Translate Domino server names to DNS. Enter as sourceString:targetString. Enter multiple pairs as CSV.',
    },
];
