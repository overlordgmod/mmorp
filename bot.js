const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const { db } = require('./firebase');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

const config = require('./config.json');

// Ссылка на Firebase для блокировки пользователей
const blockedUsersRef = db.ref('blockedUsers');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    // Игнорируем сообщения от ботов
    if (message.author.bot) return;

    // Проверяем права администратора
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return;
    }

    // Команда /mute
    if (message.content.startsWith('/mute')) {
        const args = message.content.split(' ');
        if (args.length < 3) {
            return message.reply('Использование: `/mute <время в минутах> <discord id>`');
        }

        const timeMinutes = parseInt(args[1]);
        const targetUserId = args[2];

        if (isNaN(timeMinutes) || timeMinutes <= 0) {
            return message.reply('Время должно быть положительным числом в минутах.');
        }

        if (!/^\d{17,19}$/.test(targetUserId)) {
            return message.reply('Неверный Discord ID.');
        }

        try {
            // Блокируем пользователя в Firebase
            const blockData = {
                until: Date.now() + (timeMinutes * 60 * 1000),
                reason: `Muted by ${message.author.tag} for ${timeMinutes} minutes`,
                moderator: message.author.id,
                timestamp: Date.now()
            };

            await blockedUsersRef.child(targetUserId).set(blockData);

            // Отправляем подтверждение
            const embed = {
                color: 0xff6b6b,
                title: '🔇 Пользователь заблокирован',
                fields: [
                    {
                        name: 'Пользователь',
                        value: `<@${targetUserId}> (${targetUserId})`,
                        inline: true
                    },
                    {
                        name: 'Время блокировки',
                        value: `${timeMinutes} минут`,
                        inline: true
                    },
                    {
                        name: 'Модератор',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'До',
                        value: `<t:${Math.floor((Date.now() + timeMinutes * 60 * 1000) / 1000)}:F>`,
                        inline: false
                    }
                ],
                timestamp: new Date()
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error muting user:', error);
            await message.reply('Произошла ошибка при блокировке пользователя.');
        }
    }

    // Команда /unmute
    if (message.content.startsWith('/unmute')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Использование: `/unmute <discord id>`');
        }

        const targetUserId = args[1];

        if (!/^\d{17,19}$/.test(targetUserId)) {
            return message.reply('Неверный Discord ID.');
        }

        try {
            // Удаляем блокировку из Firebase
            await blockedUsersRef.child(targetUserId).remove();

            const embed = {
                color: 0x51cf66,
                title: '🔊 Блокировка снята',
                fields: [
                    {
                        name: 'Пользователь',
                        value: `<@${targetUserId}> (${targetUserId})`,
                        inline: true
                    },
                    {
                        name: 'Модератор',
                        value: message.author.tag,
                        inline: true
                    }
                ],
                timestamp: new Date()
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error unmuting user:', error);
            await message.reply('Произошла ошибка при снятии блокировки.');
        }
    }

    // Команда /ban
    if (message.content.startsWith('/ban')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Использование: `/ban <discord id>`');
        }

        const targetUserId = args[1];

        if (!/^\d{17,19}$/.test(targetUserId)) {
            return message.reply('Неверный Discord ID.');
        }

        try {
            // Блокируем пользователя навсегда в Firebase
            const blockData = {
                until: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 год (фактически навсегда)
                reason: `Banned by ${message.author.tag}`,
                moderator: message.author.id,
                timestamp: Date.now(),
                permanent: true
            };

            await blockedUsersRef.child(targetUserId).set(blockData);

            const embed = {
                color: 0xff0000,
                title: '🚫 Пользователь забанен',
                fields: [
                    {
                        name: 'Пользователь',
                        value: `<@${targetUserId}> (${targetUserId})`,
                        inline: true
                    },
                    {
                        name: 'Модератор',
                        value: message.author.tag,
                        inline: true
                    },
                    {
                        name: 'Статус',
                        value: 'Постоянная блокировка',
                        inline: true
                    }
                ],
                timestamp: new Date()
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error banning user:', error);
            await message.reply('Произошла ошибка при бане пользователя.');
        }
    }

    // Команда /unban
    if (message.content.startsWith('/unban')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Использование: `/unban <discord id>`');
        }

        const targetUserId = args[1];

        if (!/^\d{17,19}$/.test(targetUserId)) {
            return message.reply('Неверный Discord ID.');
        }

        try {
            // Удаляем блокировку из Firebase
            await blockedUsersRef.child(targetUserId).remove();

            const embed = {
                color: 0x51cf66,
                title: '✅ Бан снят',
                fields: [
                    {
                        name: 'Пользователь',
                        value: `<@${targetUserId}> (${targetUserId})`,
                        inline: true
                    },
                    {
                        name: 'Модератор',
                        value: message.author.tag,
                        inline: true
                    }
                ],
                timestamp: new Date()
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error unbanning user:', error);
            await message.reply('Произошла ошибка при снятии бана.');
        }
    }

    // Команда /blockstatus
    if (message.content.startsWith('/blockstatus')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Использование: `/blockstatus <discord id>`');
        }

        const targetUserId = args[1];

        if (!/^\d{17,19}$/.test(targetUserId)) {
            return message.reply('Неверный Discord ID.');
        }

        try {
            const blockSnapshot = await blockedUsersRef.child(targetUserId).once('value');
            const blockData = blockSnapshot.val();

            if (!blockData) {
                const embed = {
                    color: 0x51cf66,
                    title: '✅ Пользователь не заблокирован',
                    fields: [
                        {
                            name: 'Пользователь',
                            value: `<@${targetUserId}> (${targetUserId})`,
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };
                await message.reply({ embeds: [embed] });
                return;
            }

            // Проверяем, не истек ли срок блокировки
            if (blockData.until && blockData.until < Date.now()) {
                await blockedUsersRef.child(targetUserId).remove();
                const embed = {
                    color: 0x51cf66,
                    title: '✅ Блокировка истекла',
                    fields: [
                        {
                            name: 'Пользователь',
                            value: `<@${targetUserId}> (${targetUserId})`,
                            inline: true
                        },
                        {
                            name: 'Статус',
                            value: 'Блокировка автоматически снята',
                            inline: true
                        }
                    ],
                    timestamp: new Date()
                };
                await message.reply({ embeds: [embed] });
                return;
            }

            const timeLeft = blockData.until - Date.now();
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const daysLeft = Math.floor(hoursLeft / 24);

            let timeMessage = '';
            if (blockData.permanent) {
                timeMessage = 'Постоянная блокировка';
            } else if (daysLeft > 0) {
                timeMessage = `${daysLeft}д ${hoursLeft % 24}ч ${minutesLeft}м`;
            } else if (hoursLeft > 0) {
                timeMessage = `${hoursLeft}ч ${minutesLeft}м`;
            } else {
                timeMessage = `${minutesLeft}м`;
            }

            const embed = {
                color: blockData.permanent ? 0xff0000 : 0xff6b6b,
                title: blockData.permanent ? '🚫 Пользователь забанен' : '🔇 Пользователь заблокирован',
                fields: [
                    {
                        name: 'Пользователь',
                        value: `<@${targetUserId}> (${targetUserId})`,
                        inline: true
                    },
                    {
                        name: 'Осталось времени',
                        value: timeMessage,
                        inline: true
                    },
                    {
                        name: 'Причина',
                        value: blockData.reason || 'Не указана',
                        inline: false
                    },
                    {
                        name: 'Модератор',
                        value: blockData.moderator ? `<@${blockData.moderator}>` : 'Неизвестно',
                        inline: true
                    },
                    {
                        name: 'Дата блокировки',
                        value: `<t:${Math.floor(blockData.timestamp / 1000)}:F>`,
                        inline: true
                    }
                ],
                timestamp: new Date()
            };

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error checking block status:', error);
            await message.reply('Произошла ошибка при проверке статуса блокировки.');
        }
    }

    // Проверяем, является ли сообщение личным
    if (message.channel.type === 'DM') {
        try {
            // Отправляем сообщение в канал поддержки
            const supportChannel = await client.channels.fetch(config.supportChannelId);
            if (supportChannel) {
                await supportChannel.send({
                    embeds: [{
                        title: 'Новое сообщение от пользователя',
                        description: message.content,
                        color: 0xb891f9,
                        fields: [
                            {
                                name: 'Пользователь',
                                value: `${message.author.tag} (${message.author.id})`,
                                inline: true
                            }
                        ],
                        timestamp: new Date()
                    }]
                });
                
                // Отправляем подтверждение пользователю
                await message.reply('Ваше сообщение получено! Мы ответим вам в ближайшее время.');
            }
        } catch (error) {
            console.error('Error handling DM:', error);
            await message.reply('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.');
        }
    }
});

client.login(config.token); 
