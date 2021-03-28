// panel/index.js, this filename needs to match the one registered in package.json

/** creator内置的第三方包的正确姿势 */
const fs = require("fire-fs");

const path = require("fire-path");

/** 引入项目中的脚本正确姿势 */
Editor.Panel.extend({
  // 读取css文件
  style: fs.readFileSync(Editor.url("packages://auto_generate_config/panel/index.css"), 'utf-8'),

  // 读取html文件内容

  template: fs.readFileSync(Editor.url("packages://auto_generate_config/panel/index.html"), 'utf-8'),

  // element and variable binding

  $: {
    btn: '#btn',
    label: '#label'
  },

  // method executed when template and styles are successfully loaded and initialized

  ready() {
    new window.Vue({

      el: this.shadowRoot,

      data: {
        /** 需要挂载的模板数量 */
        configDir: '',
        jsonStr: '',
        fileSavePath: ''

      },

      created() {


      },

      /** 监听talkNum */
      watch: {
        configDir(value) {
          console.log('value is ', value);
        }

      },

      methods: {
        getAsset() {
          console.log('asset');
        },
        startConfig() {
          console.log('开始监听当前拖动节点的位置');
          if (!this.fileSavePath) {
            console.log("save file path is null");
          } else {
            console.log('开始监听');

            Editor.Scene.callSceneScript('auto_generate_config', 'listenNodePosition', { filePath: this.fileSavePath }, (err, res) => {
              console.log('call over');
            })
          }
        },
        onClickSelect() {
          let path = '';
          let e = Editor.Dialog.openFile({
            title: "选择要导入的资源文件",
            defaultPath: Editor.Project.path,
            filters: [
              { name: 'Custom File Type', extensions: ['json'] }
            ],
            properties: ['openFile']

          });
          if (e !== -1) {
            path = e[0];
            console.log("path is ", path);
            this.fileSavePath = path;
            window[`configPath`] = path;
          }
        }
      }
    })
  },

  // register your ipc messages here
  messages: {

    'autobind:hello'(event) {

      this.$label.innerText = 'Hello!';

    },

    // editor save
    'scene:saved'() {
      console.log("编辑器保存了", window['configPath']);
      const configPath = window['configPath'];

      if (configPath) {
        Editor.Scene.callSceneScript('auto_generate_config', 'listenNodePosition', { filePath: configPath }, (err, res) => {
          console.log('call over');
        })
      }

    }

  }

});