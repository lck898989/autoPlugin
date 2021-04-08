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

    /** 自动配置项目目录 */
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

    'fileIsExist' (event,params) {
      const url = params.url;
      Editor.log("url is ",url);

      const isExist = Editor.assetdb.exists(params.url);
      Editor.log(`url是否存在${isExist}`);
      if(event) {
        event.reply(isExist);
      }

      Editor.assetdb.queryAssets(url,"",(err,results) => {
        Editor.log('err is ',err);
        Editor.log('results is ',results);
      })

    },

    /** start config */
    'start-config' (event,params) {
      console.log(`params is ${params}`);
    },
  },
};