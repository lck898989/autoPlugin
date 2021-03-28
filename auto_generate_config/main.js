'use strict';

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
    
  },

  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      Editor.Panel.open('auto_generate_config');
    },

    'openConfig' () {
      Editor.Panel.open('auto_generate_config.autoConfig');
    },

    'say-hello' () {
      Editor.log('Hello World!');
      // send ipc message to panel
      Editor.Ipc.sendToPanel('auto_generate_config', 'auto_generate_config:hello');
    },
    'clicked' () {
      Editor.log('Button clicked!');
    },

    /** start config */
    'start-config' (event,params) {
      console.log(`params is ${params}`);
    },
  },
};