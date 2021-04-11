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
        className: ''
      },

      created() {
        Editor.log("created");
        const localConfigDir = localStorage.getItem('configDir');
        const compName = localStorage.getItem('compName');
        const className = localStorage.getItem('className');

        if(localConfigDir) {
          Editor.log("本地组件工具目录数据",localConfigDir);
          this.configDir = localConfigDir;
        }
        if(compName) {
          Editor.log("本地组件名",compName);
          this.componentName = compName;
        }

        if(className) {
          Editor.log("本地课程名",className);
          this.className = className;
        }
      },

      mounted() {
        Editor.log('mounted');
        
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

          localStorage.setItem('configDir',this.configDir);

          Editor.log('componfentNam is ', this.componentName);
          this.startAutoBuild();

        },

        startAutoBuild() {
          if (!this.componentName) {
            Editor.log("请填写组件名");
          }

          const baseUrl = this.configDir;
          const targetUrl = Editor.Project.path + `/assets/${this.componentName}`;

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

            audioConfig:  {
              url_btn_click:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/da712475c0b0f945f50fb9f93d705493.wav',
              url_shape_click:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/b7dbde51a2af2e9fcb7ac0cfffe332b2.wav',
              url_key_click:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/172015ee5f190bd2bb169f29c01712a8.wav',
              url_key_del:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/a5bd06db353d68cbaaf173cf4229605d.wav',
              url_drag_select:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/614953c236932115f26f172e792fd0df.wav',
              url_drag_place:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/400a2ef4a74d2db423419557c987e46b.wav',
              url_drag_back:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/03da36e5b018e5a37105dbd97d98738a.wav',
              url_step_success:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/b40439a295b10b21a7717a381526d3ac.wav',
              url_step_err:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/ac69ab461d4947fa3b72ff515e652fec.wav',
              url_submit_success:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/1124add52d789d1353ac63a5aa3ed6f3.wav',
              url_submit_fail:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/911c33f26b548a33a9660b2355a9c3f8.wav',
              //结束时星星特效的声音
              game_xingxing:
                  'https://mathai-material-replace.cdn.ipalfish.com/mathai/material/replace/courseware/picbook/072b424828c69f83b7af6e4093e95894.mp3',
            }
          }

          const compName = `${this.componentName}Index`;
          let indexJsonStr = fs.readFileSync(`${baseUrl}/index.js`,'utf8');
          indexJsonStr = indexJsonStr.replace(/oneDraw/gm,this.componentName);
          Editor.log('json is ',indexJsonStr);

          if(this.className) {
            propsJson.name = this.className;
          }

          propsJson.bundleName = `${this.componentName}`;
          const coname = this.tuoFeng(this.componentName);

          propsJson.type = `cocosGame${coname}`;
          propsRealData = 'export const props = ' + JSON.stringify(propsJson, null, '\t') + '\n\n' + 'export const uid = 123456;\n' + 'export const id = 13579;';

          this.mkDirAndFile(baseUrl, targetUrl, () => {
            // Editor.log("创建文件夹成功");
          });
          console.log('targetUrl', targetUrl);
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
              let sceneMangerUuid = '';
              let prefabUuids = [];
              let pluginRunTimePath = '';
              let bundleObj = null;

              results.forEach((item) => {
                if(item.type === 'folder' && item.url === `db://assets/${compName}`) {
                  bundleObj = item;
                }
                if(item.type === 'javascript' && item.url.indexOf('SceneManager.js') >= 0) {
                  Editor.log("manage's item is ",item);
                  sceneMangerUuid = item.path;
                } 
                if (item.type === 'prefab' && item.url.indexOf('RootNode.prefab') >= 0) {
                  rootNodeUUid = item.uuid;
                }

                const regStr = /Page[1-9].prefab/;
                
                if(item.type === 'prefab' && regStr.test(item.url)) {
                  Editor.log("prefab's url is ",item.url);
                  prefabUuids.push(item);
                }
                if(item.type === 'javascript' && item.url.indexOf('Runtime.js') >= 0) {
                  Editor.log('item is ',item);
                  pluginRunTimePath = item;
                }
                
              });

              setTimeout(() => {
                if(rootNodeUUid && sceneMangerUuid) {
                  Editor.Scene.callSceneScript('auto_generate_config', 'bindScripts', { uuid: rootNodeUUid, compName,prefabUuids}, (err, res) => {
                    console.log('call over');
                  });

                  // 设置该脚本文件为插件脚本
                  Editor.Scene.callSceneScript('auto_generate_config', 'setScriptToPlugin', { item: pluginRunTimePath,bundleObj,compName }, (err, res) => {
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

          const replaceArr = ['audioUtil.js','loadUtil.js','dragComp.js','sceneManager.js','sceneLogic.js','sceneUI.js','item.js','con.js'];
          const excludeArr = ['.DS_Store','index.js','props.js','RootNode.prefab'];

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
              // Editor.log('targetDir is ',targetDir,targetUrl);
              if(targetDir === 'templates') {
                fs.mkdirSync(targetUrl, { recursive: true });
              } else {
                fs.mkdirSync(targetUrl + `/${targetDir}`, { recursive: true });

              }
              callback && callback();

            } else if (stat.isFile()) {
              const fileName = path.basename(dirStr);

              // 不导入async...await 插件脚本
              if (!this.importPlugin && fileName === 'runtime.js') {
                return;
              }

              if (excludeArr.includes(fileName)) {
                return;
              }

              let data = fs.readFileSync(dirStr, 'utf8');

              if(replaceArr.indexOf(fileName) >= 0) {
                data = data.replace(/oneDraw/gm, this.componentName);
              }
              
              const firstCha = this.tuoFeng(fileName);

              fs.writeFileSync(`${targetUrl}/${this.componentName}${firstCha}`, data);
            }
          })

        },

        tuoFeng(fileName) {
          let firstCha = fileName[0].toUpperCase();
          const remain = fileName.substring(1);
          firstCha = firstCha.concat(remain);
          return firstCha;
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

          localStorage.setItem('compName',this.componentName);
        },

        classNameConfirm(e,value) {
          this.className = e.detail.value;

          localStorage.setItem('className',this.className);
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