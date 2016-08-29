# slave-bot

## Design doc

The bot works by loading plugins with a configuration file `slave.json`.

The `slave.json` contains:

```js
{
    // Your bot token that you can find by creating a bot in the Discord dashboard
    botToken: "YOUR_BOT_TOKEN",
    botUsername: "bot username", // optional
    initialPlayingGame: "the playing game", // optional
    // Array of plugins
    plugins: [
        { name: PLUGIN_NAME, path: PLUGIN_PATH }
    ]
}
```

A plugin is a module that export:

* a string called `name` defining the plugin name.
* a string called `version` defining the plugin version. It's not used at the moment.
* a object called `plugin` with two methods: `register` and `destroy`.

It follows this interface:
```
export interface SlaveBotPlugin {
  register: (bot: Client, db?: Datastore) => Observable<any>;
  destroy: () => void;
}
```

Every plugin has its own database collection, if you don't need the database, you can leave the parameter empty.


## Try it: (work in progress)

* Create an application in your discord dashboard
* Create a bot
* Clone the project
* Create a slave.json file
* Update the config, add at least the `botToken`.
* Open this link:

`https://discordapp.com/oauth2/authorize?client_id=YOURCLIENTID&scope=bot&permissions=YOURPERMISSIONS`

The client id can be found in your application created in the dashboard.
The permissions can be found in the Discord documentation. Basic permissions for read/write are: `3072`.


