# slave-bot

## Design doc

The bot works by loading plugins with a configuration file `slave.json`.

The `slave.json` contains:

- botToken: Your bot token that you can find by creating a bot in the Discord dashboard
- botUsername: Optional 
- initialPlayingGame: The initial playing game. If the game plugin is used, the game will be store in a datastore.
- plugins: Array of plugins, optional
    + name: The name of the plugin (the name should not conflict)
    + path: If path is missing, the plugin is a name from the plugins folder
    + options: The plugin options

```json
{
    "botToken": "YOUR_BOT_TOKEN",
    "botUsername": "BOT_USERNAME",
    "initialPlayingGame": "PLAYING_GAME", 
    "plugins": [
        { "name": "PLUGIN_NAME", "path": "PLUGIN_PATH", "options": {} }
    ]
}
```

A plugin is a module that export:

* a variable called `plugin` (very important) which has:
    + a `name`
    + a `version`
    + a `register` method (optional) - Used to do some initialization
    + a `destroy` method (optional) - Used to do some cleanup
    + an optional `description`
    + a optional `usage` description
    + some optional `events` listeners

It follows this interface:
```js
export interface SlaveBotPlugin {
  name: string;
  version: string;
  description?: string;
  usage?: string;
  register?: (plugin: PluginConfiguration) => Observable<any>;
  destroy?: (plugin: PluginConfiguration) => void;
  events?: SlaveBotEvents;
}
```

You can find all the events available here: [SlaveBotEvents](./lib/events.ts)


The plugin configuration object takes:

* the plugin datastore (one datastore per plugin)
* the server
* the bot client
* the plugin options 
* the plugin state (some state that can be used across functions)


## Try it: (work in progress)

* Create an application in your [discord dashboard](https://discordapp.com/developers/applications/me#top)
* Create a bot
* Clone the project
* Create a slave.json file
* Update the config, add at least the `botToken`.
* Open this link:

`https://discordapp.com/oauth2/authorize?client_id=YOURCLIENTID&scope=bot&permissions=YOURPERMISSIONS`

The client id can be found in your application created in the dashboard.
The permissions can be found in the Discord documentation. Basic permissions for read/write are: `3072`.

* `npm install`
* `npm run tsc:watch`
* `npm run start:watch`



