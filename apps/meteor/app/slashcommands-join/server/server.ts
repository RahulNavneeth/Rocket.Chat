import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';

import { Rooms, Subscriptions } from '../../models/server';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add({
	command: 'join',
	callback: async (_command: 'join', params, item): Promise<void> => {
		let channel = params.trim();
		if (channel === '') {
			return;
		}

		channel = channel.replace('#', '');

		const userId = Meteor.userId() as string;
		const user = Meteor.users.findOne(userId);
		const room = Rooms.findOneByNameAndType(channel, 'c');

		if (!user) {
			return;
		}

		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
			fields: { _id: 1 },
		});

		if (subscription) {
			throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
				method: 'slashCommands',
			});
		}

		await Meteor.callAsync('joinRoom', room._id);
	},
	options: {
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
});
