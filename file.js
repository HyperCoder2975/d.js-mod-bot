const Discord = require("discord.js");
const request = require("request");
const childprocess = require("child_process");
const mysql = require("mysql");
const ms = require("ms");

const prefix = "?";

const bot = new Discord.Client({
    "fetch_all_members": true
});
bot.login("  S o m e  T o k e n  ");

bot.on("ready", () => console.log("Bot is online!"));

const connection = mysql.createConnection({
    "host": "localhost",
    "user": "  A  U s e r  ",
    "password": "  A  P a s s w o r d  ",
    "database": "  A  D a t a b a s e  "
});
connection.connect();

const Dev = "222079439876390922";
const Mods = "222089067028807682";
const Contributors = "222079350403629056";
const Proficient = "222079219327434752";
const Helpers = "2220877543668444928";

function checkPerms(member) {
    let roles = member.roles.map(r => r.name);
    if (member.user.id === "105408136285818880" || member.user.id === "176610059684544512") return 4;
    else if (roles.includes("Dev")) return 3;
    else if (roles.includes("Mods")) return 3;
    else if (roles.includes("Proficient")) return 2;
    else if (roles.includes("Helpers")) return 1;
    else return 0;
}

function sort(array) {
    return array.sort((a, b) => {
        a = a.toUpperCase();
        b = b.toUpperCase();
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });
}

const commands = {
    "tag": {
        permission: 0,
        usage: "?tag [add/delete] <tag>",
        execute: message => {
            let content = message.content.slice(message.content.search(" ") + 1);
            let arg = content.split(" ")[0];
            if (arg === "add") {
                if (checkPerms(message.member) < 1) return;
                if (!content.split(" ")[1]) return;

                connection.query("SELECT * FROM tags", (error, rows) => {
                    let tag = content.slice(content.search(" ") + 1);
                    let hasTag = rows.map(t => t.tag).includes(tag);
                    if (hasTag) return message.channel.sendMessage(`The tag __\`${tag}\`__ already exists.`);

                    message.channel.sendMessage(`Adding tag __\`${tag}\`__, what would you like it to say?`);
                    message.channel.awaitMessages(m => m.author.id === message.author.id, {"errors": ["time"], "max": 1, time: 40000})
                        .then(resp => {
                            resp = resp.array()[0];
                            if (resp.content === `${prefix}abort`) return message.channel.sendMessage(`Aborting tag creation of \`${tag}\`.`);

                            message.channel.sendMessage(`Created tag __\`${tag}\`__ with content:\n\`\`\`\n${resp.content}\n\`\`\``)
                                .then(msg => {
                                    connection.query("INSERT INTO tags SET ?", {"tag": tag, "content": resp.content}, function(error, result) {
                                        if (!error) return;
                                        message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                                    });
                                });
                        })
                        .catch(err => message.channel.sendMessage(`You failed to respond. Aborting tag creation.`));
                });
            } else if (arg === "delete") {
                if (checkPerms(message.member) < 2) return;
                if (!content.split(" ")[1]) return;

                connection.query("SELECT * FROM tags", (error, rows) => {
                    let tag = content.slice(content.search(" ") + 1);
                    let hasTag = rows.map(t => t.tag).includes(tag);
                    if (!hasTag) return message.channel.sendMessage(`The tag __\`${tag}\`__ doesn't exists.`);

                    message.channel.sendMessage(`Deleted tag __\`${tag}\`__.`)
                        .then(msg => {
                            connection.query(`DELETE FROM tags WHERE tag = ${mysql.escape(tag)}`, (error, result) => {
                                if (!error) return;
                                message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                            });
                        });
                });
            } else if (arg === "list") {
                connection.query("SELECT * FROM tags", (error, tags) => {
                    connection.query("SELECT * FROM examples", (error2, examples) => {
                        let tagList = sort(tags.map(t => t.tag)).join(", ");
                        let exampleList = sort(examples.map(e => e.tag)).join(", ");
                        message.channel.sendMessage(`__\`Current Tags:\`__\n\n${tagList}\n\n__\`Current Examples:\`__\n\n${exampleList}`);
                    });
                });
            } else {
                connection.query("SELECT * FROM tags", (error, rows) => {
                    if (error) return message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                    let tag = rows.filter(t => t.tag === arg);
                    if (tag[0]) {
                        message.channel.sendMessage(tag[0].content);
                        connection.query(`UPDATE tags SET usecount = usecount + 1 WHERE tag = ${mysql.escape(tag[0].tag)}`);
                    } else {
                        connection.query("SELECT * FROM examples", (error, rows) => {
                            if (error) return message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                            let example = rows.filter(e => e.tag === arg);
                            if (example[0]) {
                                message.channel.sendMessage(`${example[0].title}\n\`\`\`js\n${example[0].content}\n\`\`\`\n\u200B`);
                                connection.query(`UPDATE examples SET usecount = usecount + 1 WHERE tag = ${mysql.escape(example[0].tag)}`);
                            }
                        });
                    }
                });
            }
        }
    },
    "ahh": {
        permission: 0,
        execute: message => commands.tag.execute(message)
    },
    "example": {
        permission: 0,
        usage: "?example [add/delete] <example>",
        execute: message => {
            let content = message.content.slice(message.content.search(" ") + 1);
            let arg = content.split(" ")[0];
            if (arg === "add") {
                if (checkPerms(message.member) < 1) return;
                if (!content.split(" ")[1]) return;

                connection.query("SELECT * FROM examples", (error, rows) => {
                    let example = content.slice(content.search(" ") + 1);
                    let hasExample = rows.map(t => t.tag).includes(example);
                    if (hasExample) return message.channel.sendMessage(`The example \`${example}\` already exists.`);

                    message.channel.sendMessage(`Adding example \`${example}\`, what would you like to title it?`);
                    message.channel.awaitMessages(m => m.author.id === message.author.id, {"errors": ["time"], "max": 1, time: 40000})
                        .then(resp => {
                            resp = resp.array()[0];
                            if (resp.content === `${prefix}abort`) return message.channel.sendMessage(`Aborting example creation of \`${example}\`.`);

                            message.channel.sendMessage(`Continuing example __\`${example}\`__, what would you like the content to be?`);
                            message.channel.awaitMessages(m => m.author.id === message.author.id, {"errors": ["time"], "max": 1, time: 40000})
                                .then(resp2 => {
                                    resp2 = resp2.array()[0];
                                    message.channel.sendMessage(`Created example __\`${example}\`__.`)
                                        .then(msg => {
                                            let channel = bot.guilds.get("222078108977594368").channels.get("222092729004326912");
                                            channel.sendMessage(`${resp.content}\n\`\`\`js\n${resp2.content}\n\`\`\`\n\u200B`).then(sentMessage => {
                                                connection.query("INSERT INTO examples SET ?", {"tag": example, "title": resp.content, "content": resp2.content, "messageid": sentMessage.id}, function(error, result) {
                                                    if (!error) return;
                                                    message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                                                });
                                            }).catch(err => message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${err}`));
                                        });
                                });
                        })
                        .catch(err => message.channel.sendMessage(`You failed to respond. Aborting example creation.`));
                });
            } else if (arg === "delete") {
                if (checkPerms(message.member) < 2) return;
                if (!content.split(" ")[1]) return;

                connection.query("SELECT * FROM examples", (error, rows) => {
                    let example = content.slice(content.search(" ") + 1);
                    let hasExample = rows.map(e => e.tag).includes(example);
                    if (!hasExample) return message.channel.sendMessage(`The example __\`${example}\`__ doesn't exists.`);
                    let exampleTag = rows.filter(e => e.tag === example)[0];

                    message.channel.sendMessage(`Deleted example __\`${example}\`__.`)
                        .then(msg => {
                            let channel = bot.guilds.get("222078108977594368").channels.get("222092729004326912");
                            channel.fetchMessage(exampleTag.messageid).then(sentMessage => {
                                sentMessage.delete();
                                connection.query(`DELETE FROM examples WHERE tag = ${mysql.escape(example)}`, (error, result) => {
                                    if (!error) return;
                                    message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${error}`);
                                });
                            }).catch(err => message.channel.sendMessage(`:no_entry_sign: __\`An error occured:\`__\n\n${err}`));
                        });
                });
            } else if (arg === "list") {
                connection.query("SELECT * FROM examples", (error, examples) => {
                    let exampleList = sort(examples.map(e => e.tag)).join(", ");
                    message.channel.sendMessage(`__\`Current Examples:\`__\n\n${exampleList}`);
                });
            }
        }
    },
    "softban": {
        permission: 2,
        usage: "?softban <mention> <reason>",
        execute: message => {
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            else if (checkPerms(message.member) > 0) return message.channel.sendMessage("Say, what now? :open_mouth:");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            member.ban(4).then(mem => message.guild.unban(mem.user).then(user => message.channel.sendMessage(`Successfully softbanned __\`${mem.user.username}#${mem.user.discriminator} (${mem.user.id})\`__.`)));
        }
    },
    "kick": {
        permission: 2,
        usage: "?kick <mention> <reason>",
        execute: message => {
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            else if (checkPerms(member) > 0) return message.channel.sendMessage("Say, what now? :open_mouth:");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            member.kick().then(mem => {
                member.user.sendMessage(`You have been kicked from the **__Discord.js Official Server__** for the following reason:\n\n${reason}`);
                message.channel.sendMessage(`Successfully kicked __\`${mem.user.username}#${mem.user.discriminator} (${mem.user.id})\`__.`);
            });
        }
    },
    "ban": {
        permission: 2,
        usage: "?ban <mention> <reason>",
        execute: message => {
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            else if (checkPerms(member) > 0) return message.channel.sendMessage("Say, what now? :open_mouth:");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            member.ban(0).then(mem => {
                member.user.sendMessage(`You have been banned from the **__Discord.js Official Server__** for the following reason:\n\n${reason}`);
                message.channel.sendMessage(`Successfully banned __\`${mem.user.username}#${mem.user.discriminator} (${mem.user.id})\`__.`);
            });
        }
    },
    "unban": {
        permission: 3,
        usage: "?unban <id> <reason>",
        execute: message => {
            let id = message.content.split(" ")[1];
            if (!id) return message.channel.sendMessage("No ID given.");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            message.guild.unban(`${id}`).then(user => {
                message.channel.sendMessage(`Successfully unbanned __\`${user.username}#${user.discriminator} (${user.id})\`__.`);
            }).catch(err => message.channel.sendMessage(err));
        }
    },
    "mute": {
        permission: 1,
        usage: "?mute <mention> <reason>",
        execute: message => {
            let mutedRole = message.guild.roles.get("222125977713639424");
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            else if (checkPerms(member) > 0) return message.channel.sendMessage("Say, what now? :open_mouth:");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            if (member.roles.array().includes(mutedRole)) return message.channel.sendMessage(`User __\`${member.user.username}#${member.user.discriminator}\`__ already muted.`);
            member.addRole(mutedRole)
                .then(() => {
                    message.channel.sendMessage(`Successfully muted __\`${member.user.username}#${member.user.discriminator} (${member.user.id})\`__.`);
                })
                .catch(console.log);
        }
    },
    "unmute": {
        permission: 1,
        usage: "?unmute <mention> <reason>",
        execute: message => {
            let mutedRole = message.guild.roles.get("222125977713639424");
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            let content = message.content.slice(message.content.search(" ") + 1);
            if (!content.split(" ")[1]) return message.channel.sendMessage("No reason given.");
            let reason = content.slice(content.search(" ") + 1);
            if (!member.roles.array().includes(mutedRole)) return message.channel.sendMessage(`User __\`${member.user.username}#${member.user.discriminator}\`__ isn't muted.`);
            member.removeRole(mutedRole)
                .then(() => {
                    message.channel.sendMessage(`Successfully unmuted __\`${member.user.username}#${member.user.discriminator} (${member.user.id})\`__.`);
                });
        }
    },
    "role": {
        permission: 3,
        usage: "?role <mention>",
        execute: message => {
            let member = message.guild.member(message.mentions.users.array()[0]);
            if (!member) return message.channel.sendMessage("No user mentioned.");
            message.channel.sendMessage(`Please respond with either __\`Assign\`__ or __\`Unassign\`__ and the role name.`)
                .then(msg => {
                    message.channel.awaitMessages(m => m.author.equals(message.author), {"errors": ["time"], "max": 1, time: 40000})
                        .then(resp => {
                            resp = resp.array()[0];
                            let action = resp.content.split(" ")[0];
                            if (!resp.content.split(" ")[1]) return message.channel.sendMessage("No role given.");
                            let roleName = resp.content.slice(resp.content.search(" ") + 1);
                            let role = message.guild.roles.find("name", roleName);
                            if (!role) return message.channel.sendMessage(`Invalid role: __\`${role}\`__`);
                            if (action === "Assign") {
                                member.addRole(role);
                                message.channel.sendMessage(`Assigned role __\`${role.name}\`__.`);
                            } else if (action === "Unassign") {
                                member.removeRole(role);
                                message.channel.sendMessage(`Unassigned role __\`${role.name}\`__.`);
                            }
                        });
                });
        }
    },
    "perm": {
        permission: 0,
        usage: "?perm",
        execute: message => {
            message.reply(`your permission level is **${checkPerms(message.member)}**.`);
        }
    },
    "purge": {
        permission: 2,
        usage: "?purge [number]",
        execute: message => {
            let limit = parseInt(message.content.split(" ")[1]);
            if (!limit) limit = 50;

            message.channel.fetchMessages({"limit": limit + 1})
                .then(messages => {
                    message.channel.bulkDelete(messages)
                        .then(() => message.channel.sendMessage(":thumbsup::skin-tone-1:"))
                            .then(msg => {
                                setTimeout(() => msg.delete(), 2000);
                            });
                });
        }
    },
    "lockdown": {
        permission: 2,
        usage: "?lockdown <seconds>",
        execute: message => {
            if (message.channel.id === "222079895583457280") return message.channel.sendMessage("This channel may not be locked down.");
            let time = message.content.slice(message.content.search(" ") + 1); if (!time) time = "10"; time = ms(time);
            if (time > (ms("1 hour"))) return message.channel.sendMessage("The maximum lockdown time is 1 hour.");
            message.channel.overwritePermissions(message.guild.roles.get(Dev), {"SEND_MESSAGES": true});
            message.channel.overwritePermissions(message.guild.roles.get(Mods), {"SEND_MESSAGES": true});
            message.channel.overwritePermissions(message.guild.roles.get(Contributors), {"SEND_MESSAGES": true});
            message.channel.overwritePermissions(message.guild.roles.get(Proficient), {"SEND_MESSAGES": true});
            message.channel.overwritePermissions(message.guild.roles.get(Helpers), {"SEND_MESSAGES": true});
            message.channel.overwritePermissions(message.guild.roles.get(message.guild.id), {"SEND_MESSAGES": false})
                .then(() => message.channel.sendMessage(`This channel has been locked down for ${ms(time, {long: true})}.`));
            setTimeout(function() { message.channel.overwritePermissions(message.guild.roles.get(message.guild.id), {"SEND_MESSAGES": null})
                .then(() => message.channel.sendMessage(`The lockdown for this channel has been lifted.`)); }, time);

        }
    },
    "restart": {
        permission: 4,
        usage: "?restart",
        execute: message => {
            message.channel.sendMessage(":thumbsup::skin-tone-1:")
                .then(setTimeout(function() {
                    process.exit();
                }, 555));
        }
    },
    "$": {
        permission: 4,
        execute: message => {
            if (!message.content.split(" ")[1]) return message.channel.sendMessage("No command.");
            let command = message.content.slice(message.content.search(" ") + 1);
            message.channel.sendMessage(`Running __\`$ ${command}\`__.`)
                .then(msg => {
                    childprocess.exec(`${command}`, function(error, stdout, stderr) {
                        if (error) return message.channel.sendMessage(`__\`ERROR:\`__\n\`\`\`xl\n${error}\n\`\`\``);
                        if (stdout) message.channel.sendMessage(`__\`STD OUT:\`__\n\`\`\`xl\n${stdout}\n\`\`\``);
                        if (stderr) message.channel.sendMessage(`__\`STD ERR:\`__\n\`\`\`xl\n${stderr}\n\`\`\``);
                    });
                });
        }
    },
    "eval": {
        permission: 4,
        usage: "?eval <code>",
        execute: message => {
            let code = message.content.slice(message.content.search(" ") + 1);
            try {
                message.channel.sendMessage(`\`INPUT:\`\n\`\`\`\n${code}\n\`\`\`\n\`OUTPUT:\`\n\`\`\`\n${eval(code)}\n\`\`\``);
            } catch (err) {
                message.channel.sendMessage(`\`INPUT:\`\n\`\`\`\n${code}\n\`\`\`\n\`ERROR:\`\n\`\`\`${err}\n\`\`\``);
            }
        }
    }
};

bot.on("message", message => {
    if (message.content.match(/([A-Z0-9]|-|_){24}\.([A-Z0-9]|-|_){6}\.([A-Z0-9]|-|_){27}|mfa\.([A-Z0-9]|-|_){84}/gi)) {
        message.delete();
        message.reply("you sent your token! :smile:");
        return;
    }
    if (message.guild.id !== "222078108977594368") return;
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    let command = commands[message.content.split(" ")[0].slice(prefix.length)];
    if (!command) {
        return;
    }
    let perm = checkPerms(message.member);
    console.log(`#${message.channel.name} - ${message.member.user.username} (${perm}) - ${message.content}`);
    if (perm < command.permission) return;// message.channel.sendMessage(":x:");

    command.execute(message);
});
