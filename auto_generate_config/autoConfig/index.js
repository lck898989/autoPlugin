// panel/index.js, this filename needs to match the one registered in package.json

/** creator内置的第三方包的正确姿势 */
const fs = require("fire-fs");
const path = require("fire-path");

/** 引入项目中的脚本正确姿势 */
Editor.Panel.extend({
  // 读取css文件
  style: fs.readFileSync(Editor.url("packages://auto_generate_config/autoConfig/index.css"), 'utf-8'),

  // 读取html文件内容

  template: fs.readFileSync(Editor.url("packages://auto_generate_config/autoConfig/index.html"), 'utf-8'),

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
        componentName: '',
        importPlugin: true,
      },

      created() {


      },

      /** 监听talkNum */
      watch: {
        configDir(value) {
          console.log('value is ', value);
        },
        componentName(value) {
          Editor.log('value is ', value);
        }

      },

      methods: {
        getAsset() {
          console.log('asset');
        },

        changePlugConfig(event, data) {
          console.log('event is ', event);
          this.importPlugin = event.detail.value;
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
        async choose() {
          const e = Editor.Dialog.openFile({
            title: "选择要导入的组件或者工具的文件夹",
            defaultPath: Editor.Project.path,
            filters: [
              { name: 'Custom File Type' }
            ],
            properties: ['openDirectory']
          });
          Editor.log('e is ', e);
          if (!e) return;
          this.configDir = e[0];

          Editor.log('componfentNam is ', this.componentName);
          this.startAutoBuild();

        },

        startAutoBuild() {
          if (!this.componentName) {
            Editor.log("请填写组件名");
          }

          const baseUrl = this.configDir;
          const targetUrl = Editor.Project.path + `/assets/${this.componentName}`;

          // const texturesUrl = Editor.Project.path + `/assets/${this.componentName}/textures`;
          // const audioUrl = Editor.Project.path + `/assets/${this.componentName}/audios`;
          // const spinUrl = Editor.Project.path + `/assets/${this.componentName}/spines`;
          // const prefabsUrl = Editor.Project.path + `/assets/${this.componentName}/prefabs`;

          const propsJson = {
            name: 'P1-A3-04-双重规律-拖拽拼勋章', // 组件名称，一般为了让教研标识具体是哪个实例
            bundleName: 'measureAlbum',
            type: 'cocosGameMeasureAlbum', // 组件类型，唯一标识符，不能重复
            style: {
              // 存储一些布局样式和layout信息，非全屏组件需要用到的定位信息
              x: 0,
              y: 0,
              width: '100%',
              height: '100%',
              rotate: 0,
              borderRadius: 0,
            },
            // 自定义配置项，
            canDrag: false, //组件整体是否可以拖拽
            text: 'test',
            topic: '', //主题
            knowledge: '', //知识点

            pageIndex: 0,
            maxPage: 8,
            rewordCount: 3,

          }

          const compName = `${this.componentName}Index`;
          let indexJsonStr = fs.readFileSync(`${baseUrl}/index.js`,'utf8');
          indexJsonStr = indexJsonStr.replace(/oneDraw/gm,this.componentName);
          Editor.log('json is ',indexJsonStr);

          propsJson.bundleName = `${this.componentName}`;
          propsJson.type = `cocosGame${this.componentName}`;

          propsRealData = 'export const props = ' + JSON.stringify(propsJson, null, '\t') + '\n\n' + 'export const uid = 123456;\n' + 'export const id = 13579;';

          this.mkDirAndFile(baseUrl, targetUrl, () => {
            Editor.log("创建文件夹成功");
          });
          console.log('targetUrl', targetUrl);

          // fs.mkdirSync(texturesUrl, { recursive: true });
          // fs.mkdirSync(audioUrl, { recursive: true });
          // fs.mkdirSync(spinUrl, { recursive: true });
          // fs.mkdirSync(prefabsUrl, { recursive: true });

          setTimeout(() => {
            const indexFilePath = `${targetUrl}/${this.componentName}Index.js`;
            const propsFilePath = `${targetUrl}/${this.componentName}Props.js`;

            const indexExist = fs.existsSync(indexFilePath);
            const propsExist = fs.existsSync(propsFilePath);

            let data = fs.readFileSync(`${baseUrl}/RootNode.prefab`, 'utf8');
            if (data) {
              const p = Editor.Project.path + `/assets/${this.componentName}`;
              fs.writeFileSync(`${p}/RootNode.prefab`, data);
            };

            if (!indexExist) {
              fs.writeFileSync(indexFilePath, indexJsonStr);
            }
            if (!propsExist) {
              fs.writeFileSync(propsFilePath, propsRealData);
            }

            Editor.log('开始刷新编辑器');
            const compName = this.componentName;
            Editor.assetdb.refresh(`db://assets/${this.componentName}`, function (err, results) {
              if (err) {
                Editor.log('err is ', err);
              }
              let rootNodeUUid = ''
              let len = results.length;
              let sceneMangerUuid = '';
              let prefabUuids = [];
              let pluginRunTimePath = '';

              results.forEach((item) => {
                if(item.type === 'javascript' && item.url.indexOf('SceneManager.js') >= 0) {
                  Editor.log("manage's item is ",item);
                  sceneMangerUuid = item.path;
                } 
                if (item.type === 'prefab' && item.url.indexOf('RootNode.prefab') >= 0) {
                  rootNodeUUid = item.uuid;
                }

                const regStr = /Page[1-9].prefab/;
                Editor.log('str is ',regStr.test(item.url));
                
                if(item.type === 'prefab' && regStr.test(item.url)) {
                  prefabUuids.push(item.uuid);
                }
                if(item.type === 'javascript' && item.url.indexOf('Runtime.js') >= 0) {
                  Editor.log('item is ',item);
                  pluginRunTimePath = item.uuid;
                }
                
              });

              setTimeout(() => {
                if(rootNodeUUid && sceneMangerUuid) {
                  Editor.Scene.callSceneScript('auto_generate_config', 'bindScripts', { uuid: rootNodeUUid, compName,prefabUuids}, (err, res) => {
                    console.log('call over');
                  })

                  // 设置该脚本文件为插件脚本
                  Editor.Scene.callSceneScript('auto_generate_config', 'setScriptToPlugin', { uuid: pluginRunTimePath }, (err, res) => {
                    console.log('call over');
                  });
                }
              },1000);
              
            });
          }, 1000);
        },


        /**
         * 递归创建文件和文件夹
         * @param  {string} dirStr 源文件夹
         * @param  {string} targetUrl 目标文件夹
         * @param  {Function} callback 创建文件夹回调函数
         */
        async mkDirAndFile(dirStr, targetUrl, callback) {
          // fs.mkdirSync(dirStr);
          const dirArr = dirStr.split(path.sep);
          const targetDir = dirArr[dirArr.length - 1];

          fs.stat(dirStr, (err, stat) => {
            if (err) return;
            if (stat.isDirectory()) {
              // this.mkDirAndFile(dirStr + '');
              const res = fs.readdirSync(dirStr);
              for (let resItem of res) {
                const itemPath = dirStr + `/${resItem}`;
                let url = '';
                if(targetDir === 'templates') {
                  url = targetUrl;
                } else {
                  url = targetUrl + `/${targetDir}`;
                }

                this.mkDirAndFile(itemPath, url);
              }
              Editor.log('targetDir is ',targetDir,targetUrl);
              if(targetDir === 'templates') {
                fs.mkdirSync(targetUrl, { recursive: true });
              } else {
                fs.mkdirSync(targetUrl + `/${targetDir}`, { recursive: true });

              }
              callback && callback();

            } else if (stat.isFile()) {
              const fileName = path.basename(dirStr);

              if (!this.importPlugin && fileName === 'runtime.js') {
                return;
              }

              if (fileName === '.DS_Store' || fileName === 'index.js' || fileName === 'props.js' || fileName === 'RootNode.prefab') {
                return;
              }

              let data = fs.readFileSync(dirStr, 'utf8');

              if (fileName === 'audioUtil.js' || fileName === 'loadUtil.js' || fileName === 'dragComp.js') {
                data = data.replace(/oneDrawProps/gm, `${this.componentName}Props`);

                if (fileName === 'dragComp.js') {
                  data = data.replace(/oneDraw/gm, this.componentName);
                }
              }

              if(fileName === 'sceneManager.js') {
                data = data.replace(/oneDraw/gm, this.componentName);
              }

              
              
              let firstCha = fileName[0].toUpperCase();
              const remain = fileName.substring(1);
              firstCha = firstCha.concat(remain);

              fs.writeFileSync(`${targetUrl}/${this.componentName}${firstCha}`, data);
            }
          })


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
        },

        componentConfirm(e, value) {
          this.componentName = e.detail.value;
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