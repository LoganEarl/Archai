const eris = require('eris');
const fs = require('fs');
var common = require('common-words');

var lastMessage;

var buffmehard = false;

var theNumOfHoes = getHoes();

var currentWord = "";
var lastWordUpdate = 0;

let helpText = `\`\`\`
help text:
"hello":
    Registers you to the bot. It will make a char sheet for you if it does not already have one
"allskills":
    displays all possible skills
"setstat":
    "setstat s 40" sets your strength to 40. The stats must be abreiviated to (ws, bs, s, t, ag, int, per, wp, fel) for the rolling functionality to work
"setskill":
    "setskill dodge 0" will set dodge to a learned level. All skills default to -10 (unlearned)
"mystats":
    will display all the stats you have set. Note, if you do not set a number for a stat it will not be displayed
"myskills":
    will display all the skills you have set. Note, if you do not set a skill it will not be displayed. Assume it is set to unlearned or -10
"roll":
    "roll 10 5" will roll a d10 and add 5 to the result. 
"rollskill":
    "rollskill stealth 10" will perform a stealth check with a difficulty modifier of +10
"rollstat":
    "rollstat bs 10" will perform a ballistic skill check with a difficulty modifer of +10
"rollhit":
    not done
"rolldmg":
    not done
\`\`\``;

function getFileName(sourcePlayer){
    return "./profile/" + sourcePlayer.username + "-" + sourcePlayer.discriminator + ".json";
}

var validStats = ["ws","bs","s","t","ag","int","per","wp","fel"];

var skills = {
    "acrobatics":"ag",
    "athletics":"s",
    "awareness":"per",
    "barter":"int",
    "charm":"fel",
    "command":"fel",
    "craft":"int",
    "deceive":"fel",
    "dodge":"ag",
    "inquiry":"fel",
    "intimidate":"s",
    "linguistics":"int",
    "lore":"int",
    "parry":"ws",
    "perform":"fel",
    "scrutiny":"per",
    "sleightOfHand":"ag",
    "spellcraft":"int",
    "stealth":"ag",
    "survival":"per",
    "trade":"int"
}

var shitTalk = {
    badCommand:[
        "OK retard",
        "maybe you should have tried the \"help\" after all. God I didn't realize you such were a fucking moron",
        "kill yourself",
        "... can you not?",
        "Yea go jump in an urn",
        "I am this close to fucking banning you",
        "Maybe go back to elementary school, mongoloid",
        "You should've been aborted",
        "Get aids, idiot",
        "Fucking baka"
    ],
    badArgument:[
        "Yea learn how to structure a fucking command first dumbass.",
        "Wow, you have the instruction-following skills of a *very* talented 4 year old",
        "You tried"
    ],
    taoSaidUwU:[
        "I swear to god if you say UwU one more time",
        "Stop saying that you cringy little shit",
        "Fucking die",
        "If I had a nickle for every time you said that I would drown you with them",
        "I’m willing to bet the best part of you ran down the crack of your momma’s ass and wound up as a brown stain on the mattress!"
    ],
    finishSheet:[
        "God damn it. Finish your character sheet first... jesus"
    ]
};

function berate(reason){
    var collection = shitTalk[reason];
    if(collection){
        let randInt = Math.floor(Math.random()*collection.length);
        notifyLast(collection[randInt]);
    }else{
        notifyLast("You know I was about to berate you, but Cart fucked up and I wasn't able to figure out something to say. What a cunt")
    }
}

class Player{
    static get(sourcePlayer){
        if(!fs.existsSync(getFileName(sourcePlayer))){
            return undefined;
        }

        try{
            var data = fs.readFileSync(getFileName(sourcePlayer));
            var rawPlayer = JSON.parse(data);
            Object.setPrototypeOf(rawPlayer, Player.prototype);
            return rawPlayer;
        }catch (err){
            return undefined;
        }
    }

    constructor(playerFrom){
        this.player = playerFrom;

        this.stats = {};
        
        this.skills = {};

        this.initiative = 0;

        this.fuckups = 0;
    }

    getSkill(skill){
        let val = this.skills[skill];
        if(val === undefined || val === NaN)
            return -20;
        return val;
    }

    setStat(stat, number){
        this.stats[stat] = number;
    }

    save(speak){
        if(fs.existsSync(getFileName(this.player)) && speak){
            notifyLast("I already made you a sheet fuckwit. Did you even try \"mystats\"?");
        }else{
            fs.writeFile(getFileName(this.player),JSON.stringify(this), (err)=>{
                if(err){
                    notifyLast("Turns out Cart is an idiot who doesn't know jackall about file io. Tell him all about it");
                }else{
                    if(speak) notifyLast("Aight. Got you a sheet. Use \"help\" if you are too much of a coward to figure shit out on your own");
                }
            });
        }
    }
}

function getHoes(){
    if(fs.existsSync("hoes.mad")){
        var num = fs.readFileSync("hoes.mad");
        var numHoes = parseInt(fs.readFileSync("hoes.mad"));
        if(numHoes > 0){
            return numHoes
        }else{
            return 0
        }
    }else{
        fs.writeFile("hoes.mad",0, (err)=>{
        
        });
    }
}

function setHoes(numHoes){
    fs.writeFile("hoes.mad",numHoes, (err)=>{
        
    });
}

async function notifyLast(message){
    try {
        if(lastMessage !== undefined){
            await lastMessage.channel.createMessage(message);
            lastMessage = undefined;
        }
    } catch (err) {
        console.warn('Failed to respond to user');
        console.warn(err);
    }
}

// Create a Client instance with our bot token.
const bot = new eris.Client(process.env.BOT_TOKEN);

// When the bot is connected and ready, log to console.
bot.on('ready', () => {
   console.log('Connected and ready.');
});

function randInt(from, to){
    return Math.round(Math.random()*Math.abs(to-from))+from;
}

function setStat(player, args){
    if(args.length !== 2){
        berate("badArgument");
    }else{
        var stat = args[0];
        var val = parseInt(args[1]);

        if(validStats.includes(stat) && val !== NaN && val >= 0 && val <= 100){
            player.setStat(stat,val);
            player.save(false);
            notifyLast("Done\n" + getStats(player));
        }else{
            berate("badArgument");
        }
    }
}

function getStats(player){
    var statView = "\`\`\`" + player.player.username + "'s Stats:\n";
    for(var stat of validStats){
        statView += "[" + stat + ":" + player.stats[stat] + "] ";
    }
    statView += "\`\`\`";
    return statView;
}

function setSkill(player, args){
    if(args.length !== 2){
        berate("badArgument");
        return;
    }
    var skill = args[0];
    var number = parseInt(args[1]);

    if(skills[skill] === undefined || number === NaN){
        berate("badArgument");
        return;
    }

    player.skills[skill] = number;
    player.save(false);
    notifyLast("```Skill [" + skill + "] set to " + number + "```");
}

function showSkills(player){
    var response = "```" + player.player.username + "'s Skills\n";
    var showedSkill = false;
    for(var skill in player.skills){
        var number = player.skills[skill];
        if(number === undefined){
            response += "   [" + skill + ": -20]\n"
        }else if(number >= 0){
            response += "   [" + skill + ": +" + number + "]\n";
        }else{
            response += "   [" + skill + ": -" + number + "]\n";
        }
        showedSkill = true;
    }
    if(!showedSkill){
        response += "No learned skills"
    }
    notifyLast(response + "```");
}

function allSkills(player){
    var response = "```All Skills\n";
    for(var skill in skills){
        response += "   [" + skill + "]\n"
    }
    notifyLast(response + "```");
}

function testRoll(player, args){
    if(args.length !== 2){
        berate("badArgument");
    }else{
        var die = parseInt(args[0]);
        var bias = parseInt(args[1]);
        var reply = "```";
        if(die !== NaN && bias !== NaN && die > 0){
            let rand = roll(die, bias);
            reply += player.player.username + "'s roll: " + rand;
            if(rand == die + bias){
                reply += "(max)";
            }else if(rand == bias + 1){
                reply += "(min)";
            }
            reply += "```";
            notifyLast(reply);
        }else{
            berate("badArgument");
        }
    }
}

function rollStat(player, args){
    if(args.length == 1){
        args[1] = "0";
        args.length = 2;
    }

    if(args.length != 2){
        berate("badArgument");
        return;
    }
    var stat = args[0];
    var bias = parseInt(args[1]);

    if(!validStats.includes(stat) || bias === NaN){
        berate("badArgument");
        return;
    }

    var initialRoll = roll(100, 0);
    if(buffmehard){
        initialRoll = roll(25,0);
        buffmehard = false;
    }
    var moddedRoll = player.stats[stat] - initialRoll + bias;
    var degrees = Math.ceil(Math.abs(moddedRoll)/10);

    var response = "```" + player.player.username + "'s "  + stat + " Roll\nRaw Roll: " + initialRoll + "\nAdjusted: " + moddedRoll;

    if(moddedRoll >= 0){
        response += "\n(" +degrees+ " degree(s) of success)";
    }else{
        response += "\n(" +degrees+ " degree(s) of failure)";
    }
    response += "```";

    notifyLast(response);
}

function rollSkill(player, args){
    if(args.length == 1){
        args[1] = "0";
        args.length = 2;
    }

    if(args.length != 2){
        berate("badArgument");
        return;
    }
    var skill = args[0];
    var bias = parseInt(args[1]);

    if(skills[skill] === undefined || bias === NaN){
        berate("badArgument");
        return;
    }

    var stat = skills[skill];

    if(player.stats[stat] === undefined){
        berate("finishSheet");
        return;
    }

    var initialRoll = roll(100, 0);
    if(buffmehard){
        initialRoll = roll(25,0);
        buffmehard = false;
    }

    var moddedRoll = player.stats[stat] - initialRoll + player.getSkill(skill) + bias;
    console.log(player.stats[stat] + " - " + initialRoll + " + " + player.getSkill(skill) + " + " + bias);
    var degrees = Math.ceil(Math.abs(moddedRoll)/10);

    var response = "```" + player.player.username + "'s "  + skill + " Roll\nRaw Roll: " + initialRoll + "\nAdjusted: " + moddedRoll;

    if(moddedRoll >= 0){
        response += "\n(" +degrees+ " degree(s) of success)";
    }else{
        response += "\n(" +degrees+ " degree(s) of failure)";
    }
    response += "```";

    notifyLast(response);
}

function roll(number, bias){
    return randInt(1,number) + bias;
}

function umidAttack(player, args){
    if(args.length == 0){
        args[0] = "0";
        args[1] = "false"
        args.length = 2;
    }

    if(args.length == 1){
        args[1] = "false"
        args.length = 2;
    }

    if(args.length != 2){
        berate("badArgument");
        return;
    }
    var bias = parseInt(args[0]);
    var sneak = args[1] == "sneak"

    if(bias === NaN){
        berate("badArgument");
        return;
    }

    var response = "```" + player.player.username + "'s Attack\nMain Hand";

    var initialRoll = roll(100, 0);
    if(buffmehard){
        initialRoll = roll(25,0);
        buffmehard = false;
    }
    console.log(bias);
    var moddedRoll = player.stats["ws"] - initialRoll + bias;
    var degrees = Math.ceil(Math.abs(moddedRoll)/10);
    var swiftAttacks = 0;
    if(degrees > 0 && moddedRoll >= 0){
        swiftAttacks += 1;
        swiftAttacks += Math.floor((degrees-1)/2);
    }

    response += "\n\tRaw Roll: " + initialRoll + "\n\tAdjusted: " + moddedRoll
    if(moddedRoll > 0){
        response += "(hit)\n";
        response += "\t(" +degrees+ " degree(s) of success)";
        var dmg = roll(10,2) + Math.floor(player.stats["s"]/10);
        response += "\n\tdmg:" + dmg + " pen:2 R";
        if(dmg == 12 + Math.floor(player.stats["s"]/10)){
            response += "(max)"
        }
        if(sneak){
            response += " sneak: " + (roll(5,0) + roll(5,0));
        }

    }else{
        response += "(miss)";
        response += "\n\t(" +degrees+ " degree(s) of failure)";
    }

    initialRoll = roll(100, 0);
    moddedRoll = player.stats["ws"] - initialRoll + bias;
    degrees = Math.ceil(Math.abs(moddedRoll)/10);

    response += "\n\nOff Hand\n\tRaw Roll: " + initialRoll + "\n\tAdjusted: " + moddedRoll
    if(moddedRoll > 0){
        response += "(hit)\n";
        response += "\t(" +degrees+ " degree(s) of success)";
        var dmg = roll(10,2) + Math.floor(player.stats["s"]/10);
        response += "\n\tdmg:" + dmg + " pen:2 R";
        if(dmg == 12 + Math.floor(player.stats["s"]/10)){
            response += "(max)"
        }
        if(sneak){
            response += " sneak: " + (roll(5,0) + roll(5,0));
        }
    }else{
        response += "(miss)";
        response += "\n\t(" +degrees+ " degree(s) of failure)";
    }

    for(var i = 0; i < swiftAttacks; i++){
        response += "\n\nSwift attack " + (i+1);
        var dmg = roll(10,2) + Math.floor(player.stats["s"]/10);
        response += "\n\tdmg:" + dmg + " pen:2 R";
        if(dmg == 12 + Math.floor(player.stats["s"]/10)){
            response += "(max)"
        }
        if(sneak){
            response += " sneak: " + (roll(5,0) + roll(5,0));
        }
    }
    response += "```";
    notifyLast(response);
}

function updateWord(){
    let timestamp = new Date().getTime()
    if(timestamp > lastWordUpdate + 1000*60*60*6){
        lastWordUpdate = timestamp;
        index = roll(100,-1);
        currentWord = common[index].word;
        console.log("The current word is " + currentWord);
    }
}

// Every time a message is sent anywhere the bot is present,
// this event will fire and we will check if the bot was mentioned.
// If it was, the bot will attempt to respond with "Present".
bot.on('messageCreate', async (msg) => {
    updateWord();
    if (msg.content.startsWith("%")) {
        lastMessage = msg;
        msg.content= msg.content.slice(1);
        var args = msg.content.split(" ");

        if(args.length > 0){
            var starter = args.shift().toLocaleLowerCase();
            var sourcePlayer = Player.get(msg.author);
            if(starter !== "hello" && sourcePlayer === undefined){
                notifyLast("Who the actual fuck are you? It's polite to say \"hello\" when meeting a new person");
            }else{
                var managed = true;
                switch (starter){
                    case "hello":
                        var player = new Player(msg.author);
                        player.save(true);
                    break;
                    case "rollhit":
                        notifyLast("Not done yet");
                    break;
                    case "rollskill": case "rsk":
                        rollSkill(sourcePlayer,args)
                    break;
                    case "roll":
                        testRoll(sourcePlayer,args);
                    break;
                    case "rolldmg":
                        notifyLast("Not done yet");
                    break;
                    case "setstat":
                        setStat(sourcePlayer,args);
                    break;
                    case "setskill":
                        setSkill(sourcePlayer,args);
                    break;
                    case "help":
                        notifyLast(helpText);
                    break;
                    case "mystats":
                        notifyLast(getStats(sourcePlayer));
                    break;
                    case "rollstat": case "rst":
                        rollStat(sourcePlayer,args);
                    break;
                    case "myskills":
                        showSkills(sourcePlayer);
                    break;
                    case "allskills":
                        allSkills(sourcePlayer);
                    break;
                    case "buffmehard":
                        buffmehard = true;
                        berate("badCommand");
                    break;
                    case "umidattack":
                        umidAttack(sourcePlayer,args);
                    break;
                    case "newword":
                        lastWordUpdate = 0;
                        updateWord();
                    break;
                    default:
                        berate("badCommand");
                        managed = false;
                    break;
                }
                if(!managed){
                    sourcePlayer.fuckups += 1;
                    sourcePlayer.save(false);
                }else{
                    sourcePlayer.fuckups = 0;
                    sourcePlayer.save(false);
                }
                if(sourcePlayer.fuckups >= 4){
                    var member= msg.member;

                    member.kick("Being a moron").then((member) => {
                        notifyLast("```" + member.displayName + " got kicked for being a fucking moron```");
                    }).catch(() => {
                        notifyLast("God damn unkickable admins. Fuck all of you");
                    });
 
                    sourcePlayer.fuckups = 0;
                    sourcePlayer.save(false);
                }
            }
        }else{
            notifyLast("Yea, what am I supposed to do with that?");
        }
    }else if(msg.author.username === "Melancholic Ambrosia"){
        let content = msg.content.toLocaleLowerCase().split(" ");
        if(content.includes("owo") || content.includes("uwu")){
            lastMessage = msg;
            berate("taoSaidUwU")
        }
    }else{
        let content = msg.content.toLocaleLowerCase();
        var count = (content.match(/hoes mad/g) || []).length;

        if(count > 0){
            theNumOfHoes += count;
            setHoes(theNumOfHoes);
        }

        //if(msg.content.toLocaleLowerCase().split(" ").includes(currentWord)){
        //    msg.delete("Contained a forbidden word");
        //}
    }
    bot.editStatus("online",{
        name: "Hoes Mad x" + theNumOfHoes,
        type: 3
    })
});

bot.on('error', err => {
   console.warn(err);
});

bot.connect();