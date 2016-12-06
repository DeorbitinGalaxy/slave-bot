# slave-bot

## Design doc

The bot works by loading plugins with a configuration file `slave.json`.

The `slave.json` contains:

- botToken: Your bot token that you can find by creating a bot in the Discord dashboard
- botUsername: Optional
- initialPlayingGame: Optional
- plugins: Array of plugins, optional
    + path: If path is missing, the plugin is a name from the plugins folder

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

* a variable called plugin which has:
    + a name
    + a version
    + a register method
    + a destroy method
    + an optional description
    + a optional usage description

It follows this interface:
```js
export interface SlaveBotPlugin {
  name: string;
  version: string;
  description?: string;
  usage?: string;
  register: (plugin: PluginConfiguration) => Observable<any>;
  destroy: () => void;
}
```


The plugin configuration objects takes the plugin database (one database per plugin), the server, the bot client and the plugin options.


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
* `npm start:watch`



