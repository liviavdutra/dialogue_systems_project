import { MachineConfig, send, Action, assign, StatesConfig, EventObject, BaseActionObject } from "xstate";
import { WORDS } from "./wordsfinal"

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }));
}

interface Grammar {
    [index: string]: {
        intent: string;
        entities: {
            [index: string]: string;
        };
    };
}
const grammar: Grammar = {
    "yes": {
        intent: "None",
        entities: { affirm: "yes" },
    },
    "yes, please": {
        intent: "None",
        entities: { affirm: "yes" },
    },
    "of course": {
        intent: "None",
        entities: { affirm: "of course" },
    },
    "no": {
        intent: "None",
        entities: { reject: "no" },
    },
    "no, thanks": {
        intent: "None",
        entities: { reject: "no" },
    },
    "no way": {
        intent: "None",
        entities: { reject: "no" },
    },
    "Can you repeat?": {
        intent: "None",
        entities: { repeat: "repeat" },
    },
    "repeat": {
        intent: "None",
        entities: { repeat: "repeat" },
    },
};
export const DATABASE = WORDS.map(item => {
    return {
        word: item.Word.toLowerCase(),
        relations: item.Relation.split(",").map(item => item.toLowerCase())
    }
})


export function checkRelation2(context: SDSContext, userWord: any) {
    const wordGiven = context.unusedWords.find((item: { word: string; }) => item.word === userWord);
    //console.log(wordGiven)
    if (wordGiven) {
        //console.log(wordGiven)
        const relations = wordGiven.relations;

        if (relations.includes(context.word)) {
           // console.log(relations)
            return true
        }
        else {
            return false
        }
    }
    else {
        return false
    }
}

// next word
export function returnWord2(context: SDSContext, userWord: string) { //call function with only one argument → context.recResult[0].utterance
    const wordFound = context.unusedWords.find((item: { word: string; }) => item.word === userWord);
   // const wordFound = DATABASE.find((item: { word: string; }) => item.word === userWord);
    console.log(wordFound)
   
        if (wordFound) {
        const relations = wordFound.relations;
        let unusedwords = context.unusedWords.map((item: { word: any; }) =>{
            return item.word})
         // to remove used words from the relations
        //console.log(unusedwords)
        const allowedRelations = relations.filter((item: any) => unusedwords.includes(item))
        console.log(allowedRelations)
        const randomIndex = Math.floor(Math.random() * allowedRelations.length);
        const newWord = allowedRelations[randomIndex];
       // console.log("my variable var is equal to", unusedwords)
       // console.log(newWord)
        context.unusedWords.splice(context.unusedWords.indexOf(wordFound), 1)
        //context.unusedWords.splice(context.unusedWords.indexOf(newWord), 1)
        return newWord;
    }
}

export function firstWord(context: SDSContext) {
    const random = Math.floor(Math.random() * context.unusedWords.length)
    let wordOne = context.unusedWords[random].word
    return wordOne
}

export const getEntity = (context: SDSContext, entity: string) => {
    // lowercase the utterance and remove tailing "."
    let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
    if (u in grammar) {
        if (entity in grammar[u].entities) {
            return grammar[u].entities[entity];
        }
    }
    return false;
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = {
    initial: "idle",
    states: {
        idle: {
            on: {
                CLICK: "init",
            },
        },
        init: {
            on: {
                TTS_READY: "whoareyou",
                CLICK: "whoareyou",
            },
        },
        whoareyou: {
            id: "whoareyou",
            initial: "prompt",
            //entry: assign({unusedWords : (context) => DATABASE}),
            on: {
                RECOGNISED: [
                    {
                        target: "Introduction",
                        actions: assign({
                            name: (context) => context.recResult[0].utterance.replace(/\.$/g, ""),
                            unusedWords: (context) => DATABASE,
                           // newUnusedWords:(context) => [],
                            
                        }),
                    },
                    {
                        target: ".noinput",
                    },
                ],
                TIMEOUT: ".prompt",
            },
            states: {
                prompt: {
                    entry: say("Hey! Welcome to my game! My name is Minerva and I will be your co-player! How would you like me to call you? You can either choose your name or nickname!"),
                    on: { ENDSPEECH: "ask" },
                },
                ask: {
                    entry: send("LISTEN"),
                },
                noinput: {
                    entry: say(
                        "Sorry, I don't know what it is. Tell me something I know!"
                    ),
                    on: { ENDSPEECH: "ask" },
                },
            },
        },
        Introduction: {
            id: "Introduction",
            initial: "prompt",
            entry: [assign({score: (context) => 0 })],
            on: {
                RECOGNISED: [
                    {
                        target: "denyInstructions",
                        cond: (context) => !!getEntity(context, "reject"),
                        actions: [assign({
                            reject: (context) => getEntity(context, "reject"),
                            word: (context) => firstWord(context),
                        }),
                        assign({
                            unusedWords: (context) => context.unusedWords.filter((item: any) => item.word !== context.word)
                        })
                        ]
                    },
                    {
                        target: "acceptInstructions",
                        cond: (context) => !!getEntity(context, "affirm"),
                        actions: assign({
                            affirm: (context) => getEntity(context, "affirm"),
                            word: (context) => firstWord(context),
                        }),
                    },
                    {
                        target: ".nomatch",
                    },
                ],
                TIMEOUT: ".prompt",
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Nice to meet you, ${context.name}!I have some instructions for you!If you have played this game before, you can just skip it, but If this is your first time playing this game, I would advise you to listen to them. Do you want to hear the instructions?`,
                    })),
                    on: { ENDSPEECH: "ask" },
                },
                ask: {
                    entry: send("LISTEN"),
                },
                nomatch: {
                    entry: say(
                        "Sorry, I don't know what it is. Tell me something I know.!"
                    ),
                    on: { ENDSPEECH: "prompt" },
                },
            },
        },
        denyInstructions: {
            entry: say("Ok!Let's play!"),
            on: { ENDSPEECH: "gamestart" },
        },
        acceptInstructions: {
            entry: [
                say("Ok!Here we go!"),
                //assign((context) => ({title: `meeting with ${context.famous}`}))
            ],
            on: { ENDSPEECH: "Instructions" },
        },

        Instructions: {
            id: "Instructions",
            initial: "prompt",
            on: {
                RECOGNISED: [

                    {
                        target: "repeatInstructions",
                        cond: (context) => !!getEntity(context, "repeat"),
                        actions: assign({
                            repeat: (context) => getEntity(context, "repeat"),
                            word: (context) => firstWord(context)
                        }),
                    },
                    {
                        target: "playlater",
                        cond: (context) => !!getEntity(context, "reject"),
                        actions: assign({
                            reject: (context) => getEntity(context, "reject"),
                            word: (context) => firstWord(context),
                        }),
                    },
                    {
                        target: "playnow",
                        cond: (context) => !!getEntity(context, "affirm"),
                        actions: assign({
                            affirm: (context) => getEntity(context, "affirm"),
                            word: (context) => firstWord(context)
                        }),
                    },
                    

                    {
                        target: ".nomatch",
                    },
                ],
                TIMEOUT: ".prompt",
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `So, ${context.name}, you probably have already played this game before or heard about it!This is a game that stimulates fast thinking and also can help you to practice some vocabulary! And how does it work? I will say a word and you need to say back to me the first word that comes to your mind. But, of course, the word needs to have some kind of relation to the previous one. So, for example, if I say dog you could say cat back, but not wings! Ok? It is very simple! We also will have a try round before we start for real, so don't worry! The game will be over if you repeat a word that has already been mentioned or if you give an unrelated word. Are you ready to start playing? You can say yes, no or repeat if you would like me to repeat the instructions.`,
                    })),
                    on: { ENDSPEECH: "ask" },
                },
                ask: {
                    entry: send("LISTEN"),
                },
                nomatch: {
                    entry: say(
                        "Sorry, I don't know what it is. Tell me something I know.!"
                    ),
                    on: { ENDSPEECH: "prompt" },
                },
            },
        },
        playlater: {
            entry: say(`Ok!See you another time!`),
            on: { ENDSPEECH: "init" },
        },
        playnow: {
            entry: [
                say("Ok!Let's play!")
            ],
            on: { ENDSPEECH: "gamestart" },
        },
        repeatInstructions: {
            entry: [
                say("No worries! I will repeat it for you")
            ],
            on: { ENDSPEECH: "Instructions" },
        },
        gamestart: {
            id: "gamestart",
            initial: "prompt",
            on: {
                RECOGNISED: [

                    {
                        target: "accept",
                        cond: (context) => checkRelation2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")) === true,
                        actions: assign({
                            word: (context) => returnWord2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")),
                        }),

                    },

                    {
                        target: "Userlost",
                        cond: (context) => checkRelation2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")) === false,
                        actions: assign({
                            userword: (context) => {

                                //return context.recResult[0].utterance
                            },

                        }),

                    },

                    {
                        target: ".noinput",
                    },
                ],
                TIMEOUT: ".prompt",
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: ` ${context.word}`
                    })),
                    on: { ENDSPEECH: "ask" },
                },
                ask: {
                    entry: send("LISTEN"),
                },
                noinput: {
                    entry: say(
                        "Sorry, I don't know what it is. Tell me something I know!"
                    ),
                    on: { ENDSPEECH: "ask" },
                },
            },
        },
        gametwo: {
            id: "gametwo",
            initial: "prompt",
            entry: [assign({score: (context) => context.score +10,unusedWords: (context) => context.unusedWords.filter((item:any) => item.word !== context.word)})],
            on: {
                RECOGNISED: [

                    {
                        target: "Userlost",
                        cond: (context) => checkRelation2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")) === false,
                        actions: assign({
                            userword: (context) => {

                                //return context.recResult[0].utterance
                            },

                        }),

                    },
                //     {
                //         target: "gametwo",
                //         cond: (context) => checkRelation2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")) === true,
                //         actions:
                //           [
                      
                //           assign({ word: (context) => returnWord2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")), }),
                //           assign({ unusedWords: (context) => context.unusedWords.filter((item:any) => item.word !== context.recResult[0].utterance.toLowerCase().replace(".", "") )}),
                      
                //           assign({ unusedWords: (context) => context.unusedWords.filter((item:any) => item.word !== context.word) }),
                // ]},
                    {
                        target: "gametwo",
                        cond: (context) => checkRelation2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")) === true,
                        actions: 
                            //(context) => console.log(context.word, context.unusedWords),
                    [assign({
                                            word: (context) => returnWord2(context, context.recResult[0].utterance.toLowerCase().replace(".", "")),
                                        }),
                           (context) => console.log(context.word, context.unusedWords),
                                        assign({
                                        unusedWords: (context) => context.unusedWords.filter((item:any) => item.word !== context.word)
                                        }),
                           // (context) => console.log(context.word, context.unusedWords),
                                        ]
                    },

                    {
                        target: ".noinput",
                    },
                ],
                TIMEOUT: ".prompt",
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: ` ${context.word}`
                    })),
                    on: { ENDSPEECH: "ask" },
                },
                ask: {
                    entry: send("LISTEN"),
                },
                noinput: {
                    entry: say(
                        "Sorry, I don't know what it is. Tell me something I know!"
                    ),
                    on: { ENDSPEECH: "ask" },
                },
            },

        },
        accept: {
            id: "accept",

            entry: send((context) => ({
                type: "SPEAK",
                value: `You got it!Let's start playing for real now!`
            })),
            on: { ENDSPEECH: "gametwo" },
        },

        Userlost: {
            id: "Userlost",
            entry: send((context) => ({
                type: "SPEAK",
                value: `Game Over!Let's see how many points you got!`
            })),
            on: { ENDSPEECH: "points" },
        },
        points: {
            id: "points",
            entry: send((context) => ({
                type: "SPEAK",
                value: `Your score is ${context.score}!Do you think you can do better? Take another shot!`
            })),
            on: { ENDSPEECH: "init" },
        },
       
    },

};
